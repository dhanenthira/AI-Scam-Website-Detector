"""
Website security scanner services for ScamGuard AI.
Implements modular inspection, SSRF prevention, DOM analysis,
risk scoring, and AI security synthesis.
"""
import ipaddress
import json
import logging
import os
import re
import socket
import ssl
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from django.conf import settings

logger = logging.getLogger(__name__)

# Constants
MAX_RESPONSE_SIZE = 2 * 1024 * 1024  # 2 MB limit to prevent memory exhaustion / DoS
DEFAULT_TIMEOUT = 7  # Seconds
MAX_REDIRECTS = 5

# Common brand names targeted by phishing
TARGETED_BRANDS = [
    'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'facebook',
    'instagram', 'chase', 'bankofamerica', 'wellsfargo', 'citibank', 'binance',
    'coinbase', 'metamask', 'walmart', 'ebay', 'dhl', 'fedex', 'usps'
]

# Suspicious TLDs frequently associated with disposable scam/phishing sites
SUSPICIOUS_TLDS = {
    'xyz', 'top', 'tk', 'buzz', 'click', 'fit', 'work', 'rest', 'country',
    'gq', 'ml', 'cf', 'ga', 'monster', 'hair', 'quest', 'skin', 'cam'
}

# Scam / Urgency trigger keywords
SCAM_KEYWORDS = [
    r'account (?:has been )?suspended',
    r'verify your (?:account|identity|password|wallet)',
    r'unauthorized (?:activity|access|transaction)',
    r'urgent (?:action|notice) required',
    r'claim (?:your )?(?:prize|reward|bonus|lottery)',
    r'congratulations!? you (?:have )?won',
    r'send (?:bitcoin|btc|eth|crypto|usdt)',
    r'enter your (?:credit card|ssn|social security|pin|seed phrase)',
    r'wire transfer immediately',
    r'your device is infected',
    r'system error \d+',
    r'call microsoft support',
    r'security alert.*threat detected',
]


def extract_domain(url: str) -> str:
    """
    Extract clean domain name/hostname from URL.
    """
    if not url:
        return ""
    if not (url.startswith('http://') or url.startswith('https://')):
        url = 'https://' + url
    parsed = urlparse(url)
    hostname = parsed.hostname or ''
    return hostname.lower().strip('.')


def validate_url(url: str) -> tuple[bool, str, str | None]:
    """
    Validate URL syntax, protocol, and prevent Server-Side Request Forgery (SSRF).
    Ensures URL resolves only to public, non-private IP addresses.

    Returns:
        (is_valid, sanitized_url, error_message)
    """
    if not url or not isinstance(url, str):
        return False, "", "URL is required and must be a string."

    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception as exc:
        return False, "", f"Invalid URL format: {str(exc)}"

    if not parsed.scheme:
        url = 'https://' + url
        try:
            parsed = urlparse(url)
        except Exception as exc:
            return False, "", f"Invalid URL format: {str(exc)}"

    if parsed.scheme.lower() not in ('http', 'https'):
        return False, "", "Only HTTP and HTTPS protocols are supported."

    domain = parsed.hostname
    if not domain:
        return False, "", "Could not resolve a valid hostname from the URL."

    # SSRF Prevention: Disallow localhost & reserved keywords
    if domain.lower() in ('localhost', '127.0.0.1', '::1', '0.0.0.0', 'metadata.google.internal'):
        return False, "", "Access to local or internal loopback addresses is forbidden."

    # Resolve IP addresses and verify they are strictly public
    try:
        addr_info = socket.getaddrinfo(domain, None)
        ips = [entry[4][0] for entry in addr_info]
        if not ips:
            return False, "", "Could not resolve domain IP address."

        for ip_str in ips:
            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_reserved
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_unspecified
                # Block AWS metadata service IPv4
                or ip_str == '169.254.169.254'
            ):
                return False, "", f"Access to private/internal IP address ({ip_str}) is prohibited."
    except socket.gaierror:
        return False, "", "Domain does not exist or failed DNS resolution."
    except Exception as exc:
        return False, "", f"DNS validation error: {str(exc)}"

    return True, url, None


def check_ssl(domain: str, port: int = 443) -> dict:
    """
    Inspect SSL/TLS certificate for the given domain.
    """
    result = {
        "valid": False,
        "issuer": "None",
        "expires": "None",
        "error": None
    }

    if not domain:
        result["error"] = "Empty domain."
        return result

    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    try:
        with socket.create_connection((domain, port), timeout=4) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    result["valid"] = True
                    # Extract issuer
                    issuer_dict = dict(x[0] for x in cert.get('issuer', []))
                    result["issuer"] = issuer_dict.get('organizationName') or issuer_dict.get('commonName', 'Unknown')
                    result["expires"] = cert.get('notAfter', 'Unknown')
    except ssl.SSLCertVerificationError as exc:
        result["valid"] = False
        result["error"] = f"SSL Verification Failed: {exc.verify_message}"
    except (socket.timeout, socket.gaierror, ConnectionRefusedError, OSError) as exc:
        result["valid"] = False
        result["error"] = f"SSL Connection Failed: {str(exc)}"

    return result


def fetch_website(url: str, max_size_bytes: int = MAX_RESPONSE_SIZE, timeout: int = DEFAULT_TIMEOUT) -> dict:
    """
    Safely fetch website content with response size limits, SSRF redirect checks,
    and timeout enforcement. Never executes JavaScript.
    """
    session = requests.Session()
    session.max_redirects = MAX_REDIRECTS

    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/124.0.0.0 Safari/537.36 ScamGuardBot/1.0'
        ),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    result = {
        "status_code": 0,
        "final_url": url,
        "history": [],
        "content": "",
        "headers": {},
        "error": None
    }

    try:
        # Stream response to cap downloaded size
        with session.get(url, headers=headers, timeout=timeout, stream=True, allow_redirects=True) as resp:
            # SSRF check on final URL
            final_valid, _, ssrf_err = validate_url(resp.url)
            if not final_valid:
                result["error"] = f"Redirected to illegal destination: {ssrf_err}"
                return result

            result["status_code"] = resp.status_code
            result["final_url"] = resp.url
            result["history"] = [h.url for h in resp.history]
            result["headers"] = dict(resp.headers)

            content_chunks = []
            downloaded_bytes = 0
            for chunk in resp.iter_content(chunk_size=8192, decode_unicode=True):
                if chunk:
                    content_chunks.append(chunk)
                    downloaded_bytes += len(chunk.encode('utf-8', errors='ignore'))
                    if downloaded_bytes >= max_size_bytes:
                        break

            result["content"] = "".join(content_chunks)

    except requests.exceptions.SSLError as exc:
        result["error"] = f"SSL error during fetch: {str(exc)}"
    except requests.exceptions.TooManyRedirects:
        result["error"] = "Exceeded maximum redirect limit."
    except requests.exceptions.Timeout:
        result["error"] = "Connection timed out while fetching website."
    except requests.exceptions.RequestException as exc:
        result["error"] = f"Failed to connect to website: {str(exc)}"

    return result


def check_redirects(history: list, final_url: str, original_url: str) -> dict:
    """
    Inspect redirect chain for suspicious activity:
    - Multiple hops (> 3)
    - Domain hopping (redirecting to a completely different domain)
    - Protocol downgrade (HTTPS -> HTTP)
    """
    suspicious = False
    reasons = []

    if len(history) > 3:
        suspicious = True
        reasons.append(f"Excessive redirects detected ({len(history)} hops)")

    orig_domain = extract_domain(original_url)
    final_domain = extract_domain(final_url)

    if orig_domain and final_domain and orig_domain != final_domain:
        # Check if it's just www. vs non-www
        normalized_orig = orig_domain.removeprefix('www.')
        normalized_final = final_domain.removeprefix('www.')
        if normalized_orig != normalized_final:
            suspicious = True
            reasons.append(f"Domain mismatch across redirects: '{orig_domain}' redirected to '{final_domain}'")

    if original_url.startswith('https://') and final_url.startswith('http://'):
        suspicious = True
        reasons.append("Insecure protocol downgrade from HTTPS to HTTP detected")

    return {
        "suspicious": suspicious,
        "redirect_count": len(history),
        "history": history,
        "reasons": reasons
    }


def analyze_url(url: str, domain: str) -> dict:
    """
    Inspect URL patterns, domain naming tricks, brand impersonation,
    and high-risk TLDs.
    """
    indicators = []
    is_phishing = False

    # Check for IP address in hostname (e.g. http://192.168.1.1/login)
    clean_host = domain.split(':')[0]
    try:
        ipaddress.ip_address(clean_host)
        indicators.append("Host is a raw IP address rather than a registered domain name")
        is_phishing = True
    except ValueError:
        pass

    # Check for suspicious TLD
    tld = domain.split('.')[-1].lower() if '.' in domain else ''
    if tld in SUSPICIOUS_TLDS:
        indicators.append(f"Domain uses high-risk/disposable top-level domain (.{tld})")

    # Check for brand impersonation in subdomains (e.g. paypal.security-alert.xyz)
    subdomains = domain.split('.')[:-2] if len(domain.split('.')) > 2 else []
    for brand in TARGETED_BRANDS:
        for sub in subdomains:
            if brand in sub.lower():
                indicators.append(f"Brand impersonation attempt detected for '{brand}' in subdomain '{sub}'")
                is_phishing = True

    # Check for excessive hyphens or random-looking domain
    if domain.count('-') >= 3:
        indicators.append("Domain contains excessive hyphens (common scam obfuscation)")

    # Check for @ symbol in URL (HTTP basic auth trick to fool users)
    if '@' in url:
        indicators.append("URL contains '@' sign, which can mask the real destination")
        is_phishing = True

    # Check URL length
    if len(url) > 120:
        indicators.append("Abnormally long URL (> 120 characters)")

    return {
        "is_phishing": is_phishing,
        "indicators": indicators,
        "tld": tld
    }


def analyze_content(html_content: str, url: str) -> dict:
    """
    Inspect page DOM, forms, payment requests, login inputs,
    and deceptive scam text patterns.
    """
    if not html_content:
        return {
            "title": "No Content",
            "meta_description": "",
            "has_login_form": False,
            "has_payment_form": False,
            "insecure_password_form": False,
            "scam_phrases_found": [],
            "phishing_detected": False,
            "malware_detected": False,
            "hidden_iframes_count": 0,
            "sanitized_snippet": ""
        }

    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract title and meta description
    title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled Page"
    meta_desc = ""
    desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
    if desc_tag and desc_tag.get('content'):
        meta_desc = desc_tag['content'].strip()

    # Form analysis
    forms = soup.find_all('form')
    has_login_form = False
    has_payment_form = False
    insecure_password_form = False
    current_domain = extract_domain(url)

    for form in forms:
        inputs = form.find_all('input')
        input_types = [inp.get('type', '').lower() for inp in inputs]
        input_names = [inp.get('name', '').lower() for inp in inputs]

        # Password detection
        if 'password' in input_types:
            has_login_form = True
            action = form.get('action', '')
            # Check if submitting over HTTP or to a different domain
            if url.startswith('http://') or action.startswith('http://'):
                insecure_password_form = True
            if action.startswith('http://') or action.startswith('https://'):
                action_domain = extract_domain(action)
                if action_domain and current_domain and action_domain != current_domain:
                    insecure_password_form = True

        # Payment inputs
        for name in input_names:
            if any(term in name for term in ('card', 'cc_number', 'cvv', 'cvc', 'exp', 'crypto', 'wallet')):
                has_payment_form = True

    # Text keyword analysis for urgency / scam keywords
    page_text = soup.get_text(separator=' ', strip=True).lower()
    scam_phrases_found = []
    for pattern in SCAM_KEYWORDS:
        if re.search(pattern, page_text, re.IGNORECASE):
            scam_phrases_found.append(pattern.replace(r'(?:', '').replace(r')?', '').replace(r')', ''))

    # Hidden iframes / malware markers
    iframes = soup.find_all('iframe')
    hidden_iframes_count = 0
    for iframe in iframes:
        style = iframe.get('style', '').lower()
        width = iframe.get('width', '')
        height = iframe.get('height', '')
        if 'display:none' in style or 'visibility:hidden' in style or width in ('0', '1') or height in ('0', '1'):
            hidden_iframes_count += 1

    # Heuristic determination
    phishing_detected = insecure_password_form or (has_login_form and len(scam_phrases_found) >= 2)
    malware_detected = hidden_iframes_count > 0 or ("threat detected" in page_text and "system error" in page_text)

    # Sanitize snippet for AI processing (first 1200 characters without code)
    for tag in soup(['script', 'style', 'noscript', 'svg']):
        tag.decompose()
    clean_text = ' '.join(soup.get_text().split())[:1200]

    return {
        "title": title[:200],
        "meta_description": meta_desc[:300],
        "has_login_form": has_login_form,
        "has_payment_form": has_payment_form,
        "insecure_password_form": insecure_password_form,
        "scam_phrases_found": scam_phrases_found,
        "phishing_detected": phishing_detected,
        "malware_detected": malware_detected,
        "hidden_iframes_count": hidden_iframes_count,
        "sanitized_snippet": clean_text
    }


def get_domain_age(domain: str) -> str:
    """
    Retrieve domain registration date and approximate age using RDAP protocol.
    Falls back gracefully if unavailable.
    """
    if not domain:
        return "Unknown"

    clean_domain = domain.removeprefix('www.')
    rdap_url = f"https://rdap.org/domain/{clean_domain}"

    try:
        response = requests.get(
            rdap_url,
            timeout=4,
            headers={'Accept': 'application/rdap+json,application/json'}
        )
        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            registration_date_str = None
            for event in events:
                if event.get('eventAction') == 'registration':
                    registration_date_str = event.get('eventDate')
                    break

            if registration_date_str:
                # Parse ISO date
                clean_date = registration_date_str.split('T')[0]
                reg_dt = datetime.strptime(clean_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                now_dt = datetime.now(timezone.utc)
                days_old = (now_dt - reg_dt).days

                if days_old < 30:
                    return f"{days_old} days"
                elif days_old < 365:
                    months = max(1, days_old // 30)
                    return f"{months} months"
                else:
                    years = days_old // 365
                    months = (days_old % 365) // 30
                    return f"{years} years, {months} months" if months > 0 else f"{years} years"
    except Exception as exc:
        logger.debug("RDAP query failed for %s: %s", domain, exc)

    return "Unknown"


def calculate_risk_score(
    ssl_status: bool,
    suspicious_redirects: bool,
    url_analysis: dict,
    content_analysis: dict,
    domain_age: str,
    fetch_error: str | None
) -> tuple[int, str, bool, bool]:
    """
    Calculate safety/trust score from 0 (Critical Risk) to 100 (Safe/Low Risk).

    Returns:
        (risk_score, risk_level, phishing_detected, malware_detected)
    """
    # Start with ideal safety score
    score = 100

    phishing_detected = url_analysis.get('is_phishing', False) or content_analysis.get('phishing_detected', False)
    malware_detected = content_analysis.get('malware_detected', False)

    # 1. SSL / TLS Status
    if not ssl_status:
        score -= 25

    # 2. Redirect anomalies
    if suspicious_redirects:
        score -= 20

    # 3. Phishing Indicators
    if phishing_detected:
        score -= 40

    # 4. Malware Indicators
    if malware_detected:
        score -= 45

    # 5. Insecure form handling
    if content_analysis.get('insecure_password_form', False):
        score -= 30

    # 6. High-risk TLD
    if url_analysis.get('tld') in SUSPICIOUS_TLDS:
        score -= 15

    # 7. URL anomalies (hyphens, long URLs, etc.)
    for indicator in url_analysis.get('indicators', []):
        if "Brand impersonation" in indicator:
            score -= 35
        elif "raw IP address" in indicator:
            score -= 30
        elif "excessive hyphens" in indicator:
            score -= 10

    # 8. Scam urgency phrases
    scam_count = len(content_analysis.get('scam_phrases_found', []))
    if scam_count > 0:
        score -= min(30, scam_count * 10)

    # 9. Domain age penalty (young domains are statistically higher risk)
    if domain_age != "Unknown":
        if "days" in domain_age:
            score -= 20
        elif "months" in domain_age:
            try:
                months = int(domain_age.split()[0])
                if months < 6:
                    score -= 10
            except ValueError:
                pass

    # 10. Fetch errors (offline / blocked / reset)
    if fetch_error:
        score -= 15

    # Clamp score between 0 and 100
    score = max(5, min(98, score))

    # If critical threats detected, guarantee high/critical tier
    if phishing_detected or malware_detected:
        score = min(score, 35)

    # Determine risk level
    if score >= 80:
        risk_level = "LOW"
    elif score >= 60:
        risk_level = "MEDIUM"
    elif score >= 30:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return score, risk_level, phishing_detected, malware_detected


def call_ai_security_analysis(scan_context: dict) -> dict:
    """
    Execute AI security analysis using Gemini API or OpenAI API with fallback.
    Constraints:
    - Never claim a website is guaranteed to be safe.
    - Provide structured summary, risks, and recommendations.
    """
    provider = getattr(settings, 'AI_PROVIDER', 'gemini')
    api_key = getattr(settings, 'AI_API_KEY', '')

    prompt = f"""
You are ScamGuard AI, an elite cybersecurity scanning assistant.
Analyze the following technical website scan data and generate a JSON security assessment.

SCAN DATA:
- Target URL: {scan_context.get('url')}
- Domain: {scan_context.get('domain')}
- SSL Certificate Status: {scan_context.get('ssl_status')}
- Suspicious Redirects: {scan_context.get('suspicious_redirects')}
- Domain Age: {scan_context.get('domain_age')}
- Calculated Safety Score: {scan_context.get('risk_score')}/100 ({scan_context.get('risk_level')} Risk)
- Phishing Detected: {scan_context.get('phishing_detected')}
- Malware Detected: {scan_context.get('malware_detected')}
- URL Anomaly Indicators: {json.dumps(scan_context.get('url_indicators', []))}
- Suspicious Phrases: {json.dumps(scan_context.get('scam_phrases', []))}
- Page Title: {scan_context.get('title', 'Unknown')}
- Content Snippet: {scan_context.get('content_snippet', '')[:500]}

MANDATORY RULES:
1. NEVER state or imply that any website is 100% "guaranteed to be safe".
2. Explain the reason for the safety score in clear, objective security terminology.
3. Highlight detected risks, brand impersonation risks, or domain age factors.
4. Provide actionable precautionary advice for users.
5. Return ONLY a valid JSON object with these exact keys:
   {{
     "summary": "Concise 1-2 sentence overall verdict explaining the score and safety tier.",
     "risks": ["Specific risk 1", "Specific risk 2"],
     "recommendations": ["Actionable precaution 1", "Actionable precaution 2"]
   }}
"""

    # 1. Try Gemini API if configured
    if provider == 'gemini' and api_key and api_key != 'your_api_key':
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(getattr(settings, 'AI_MODEL', 'gemini-1.5-flash'))
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            if 'summary' in data and 'risks' in data and 'recommendations' in data:
                return data
        except Exception as exc:
            logger.warning("Gemini AI API call failed, using intelligent security engine: %s", exc)

    # 2. Try OpenAI API if configured
    if provider == 'openai' and api_key and api_key != 'your_api_key':
        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=getattr(settings, 'AI_MODEL', 'gpt-4o-mini'),
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert. Output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            data = json.loads(response.choices[0].message.content)
            if 'summary' in data and 'risks' in data and 'recommendations' in data:
                return data
        except Exception as exc:
            logger.warning("OpenAI API call failed, using intelligent security engine: %s", exc)

    # 3. Deterministic Heuristic Security Engine (Fallback)
    return _generate_heuristic_security_analysis(scan_context)


def _generate_heuristic_security_analysis(context: dict) -> dict:
    """
    Intelligent heuristic security analysis when external AI API keys are not supplied.
    Produces high quality, compliant structured output.
    """
    score = context.get('risk_score', 80)
    level = context.get('risk_level', 'LOW')
    domain = context.get('domain', '')
    ssl_status = context.get('ssl_status', False)
    phishing = context.get('phishing_detected', False)
    malware = context.get('malware_detected', False)
    redirects = context.get('suspicious_redirects', False)
    age = context.get('domain_age', 'Unknown')
    scam_phrases = context.get('scam_phrases', [])

    risks = []
    recommendations = []

    if not ssl_status:
        risks.append("Website lacks valid SSL/TLS encryption. Traffic can be intercepted.")
        recommendations.append("Never submit passwords, personal data, or banking details over this connection.")

    if redirects:
        risks.append("Suspicious redirect patterns detected across unexpected hostnames or protocol downgrades.")
        recommendations.append("Inspect your browser address bar to confirm the final landing domain.")

    if phishing:
        risks.append("Potential phishing indicators detected (credential interception or brand impersonation).")
        recommendations.append("Do not authenticate or enter account credentials on this page.")

    if malware:
        risks.append("Deceptive overlays or hidden scripts flagged during DOM inspection.")
        recommendations.append("Do not download files or run executables suggested by this site.")

    if age != "Unknown" and ("days" in age or "months" in age):
        risks.append(f"Domain is relatively new (registered {age} ago).")
        recommendations.append("Verify the organization through independent third-party channels.")

    if scam_phrases:
        risks.append(f"High-pressure urgency keywords detected ({', '.join(scam_phrases[:2])}).")
        recommendations.append("Be alert to social engineering and fake urgency tactics.")

    if not risks:
        risks.append("No major suspicious indicators detected, but caution is always advised.")
        recommendations.append("Always verify the web address before submitting sensitive information.")

    if level == "LOW":
        summary = (
            f"The website for '{domain}' appears to have a low risk based on automated security checks. "
            f"No critical phishing or malware indicators were detected; however, standard precautions remain recommended."
        )
    elif level == "MEDIUM":
        summary = (
            f"The website received a moderate score ({score}/100). Some cautionary factors were identified, "
            f"including domain characteristics or lack of established trust history."
        )
    elif level == "HIGH":
        summary = (
            f"High risk detected for '{domain}' with a safety score of {score}/100. "
            f"Several suspicious signals or deceptive patterns were flagged."
        )
    else:
        summary = (
            f"CRITICAL risk detected for '{domain}'. "
            f"Active phishing, malware, or malicious credential harvesting indicators were identified."
        )

    return {
        "summary": summary,
        "risks": risks,
        "recommendations": recommendations
    }


def generate_security_summary(scan_data: dict, ai_analysis: dict = None) -> str:
    """
    Generate unified security summary text.
    """
    if ai_analysis and ai_analysis.get('summary'):
        return ai_analysis['summary']

    return _generate_heuristic_security_analysis(scan_data).get('summary', '')


def run_full_scan(url: str, user=None) -> dict:
    """
    Orchestrate full end-to-end scanning pipeline:
    1. Validate URL & SSRF prevention
    2. Extract domain
    3. Check SSL
    4. Fetch website safely
    5. Check redirects
    6. Analyze URL structure
    7. Analyze HTML DOM & content
    8. Query domain age
    9. Calculate risk score & classification
    10. AI Security Analysis
    11. Generate summary
    """
    # 1. Validation
    is_valid, sanitized_url, err = validate_url(url)
    if not is_valid:
        raise ValueError(err or "Invalid URL")

    # 2. Extract domain
    domain = extract_domain(sanitized_url)

    # 3. Check SSL
    ssl_result = check_ssl(domain)
    ssl_status = ssl_result.get('valid', False)

    # 4. Fetch website content safely
    fetch_result = fetch_website(sanitized_url)
    html_content = fetch_result.get('content', '')

    # 5. Check redirects
    redirect_result = check_redirects(
        fetch_result.get('history', []),
        fetch_result.get('final_url', sanitized_url),
        sanitized_url
    )
    suspicious_redirects = redirect_result.get('suspicious', False)

    # 6. Analyze URL
    url_analysis = analyze_url(sanitized_url, domain)

    # 7. Analyze Content
    content_analysis_data = analyze_content(html_content, sanitized_url)

    # 8. Domain Age
    domain_age = get_domain_age(domain)

    # 9. Risk Scoring
    risk_score, risk_level, phishing_detected, malware_detected = calculate_risk_score(
        ssl_status=ssl_status,
        suspicious_redirects=suspicious_redirects,
        url_analysis=url_analysis,
        content_analysis=content_analysis_data,
        domain_age=domain_age,
        fetch_error=fetch_result.get('error')
    )

    # Build context for AI analysis
    ai_context = {
        "url": sanitized_url,
        "domain": domain,
        "ssl_status": ssl_status,
        "suspicious_redirects": suspicious_redirects,
        "domain_age": domain_age,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "phishing_detected": phishing_detected,
        "malware_detected": malware_detected,
        "url_indicators": url_analysis.get('indicators', []),
        "scam_phrases": content_analysis_data.get('scam_phrases_found', []),
        "title": content_analysis_data.get('title', ''),
        "content_snippet": content_analysis_data.get('sanitized_snippet', '')
    }

    # 10. AI Security Analysis
    ai_result = call_ai_security_analysis(ai_context)

    # 11. Security Summary
    security_summary = ai_result.get('summary', '') or generate_security_summary(ai_context, ai_result)

    # Package structured content_analysis JSON
    combined_content_analysis = {
        "title": content_analysis_data.get('title'),
        "meta_description": content_analysis_data.get('meta_description'),
        "has_login_form": content_analysis_data.get('has_login_form'),
        "has_payment_form": content_analysis_data.get('has_payment_form'),
        "ssl_details": ssl_result,
        "redirect_details": redirect_result,
        "url_indicators": url_analysis.get('indicators', []),
        "scam_phrases_found": content_analysis_data.get('scam_phrases_found', []),
        "ai_risks": ai_result.get('risks', []),
        "ai_recommendations": ai_result.get('recommendations', [])
    }

    return {
        "user": user,
        "url": sanitized_url,
        "domain": domain,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "ssl_status": ssl_status,
        "phishing_detected": phishing_detected,
        "malware_detected": malware_detected,
        "suspicious_redirects": suspicious_redirects,
        "domain_age": domain_age,
        "content_analysis": combined_content_analysis,
        "security_summary": security_summary
    }
