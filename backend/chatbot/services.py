"""
AI Chatbot Service for ScamGuard AI.
Answers user queries strictly grounded in the technical scan data of the website.
"""
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def answer_scan_query(scan_record, user_message: str) -> str:
    """
    Generate an answer to the user's question regarding a specific WebsiteScan record.
    Uses Gemini API, OpenAI API, or contextual security reasoning fallback.
    """
    provider = getattr(settings, 'AI_PROVIDER', 'gemini')
    api_key = getattr(settings, 'AI_API_KEY', '')

    # Prepare structured scan facts
    scan_facts = {
        "id": scan_record.id,
        "url": scan_record.url,
        "domain": scan_record.domain,
        "risk_score": scan_record.risk_score,
        "risk_level": scan_record.risk_level,
        "ssl_status": "Valid / Active" if scan_record.ssl_status else "Invalid or Missing",
        "phishing_detected": scan_record.phishing_detected,
        "malware_detected": scan_record.malware_detected,
        "suspicious_redirects": scan_record.suspicious_redirects,
        "domain_age": scan_record.domain_age,
        "security_summary": scan_record.security_summary,
        "content_analysis": scan_record.content_analysis or {},
    }

    system_prompt = (
        "You are the ScamGuard AI Security Assistant. You help users understand technical website scans.\n"
        "MANDATORY INSTRUCTIONS:\n"
        "1. You must answer questions EXCLUSIVELY using the scanned technical facts provided below.\n"
        "2. Do NOT answer as if you have live, real-time knowledge of the external website beyond this scan report.\n"
        "3. Explain findings in plain, easy-to-understand, friendly yet professional language.\n"
        "4. NEVER claim that any website is 100% guaranteed safe. Always advise standard cybersecurity hygiene.\n"
        "5. Address the user's specific question directly (e.g. why score was assigned, SSL status, entering cards/passwords).\n\n"
        f"SCANNED WEBSITE CONTEXT:\n{json.dumps(scan_facts, indent=2)}\n"
    )

    # 1. Try Gemini API
    if provider == 'gemini' and api_key and api_key != 'your_api_key':
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name=getattr(settings, 'AI_MODEL', 'gemini-1.5-flash'),
                system_instruction=system_prompt
            )
            response = model.generate_content(user_message)
            if response.text:
                return response.text.strip()
        except Exception as exc:
            logger.warning("Gemini AI Chat query failed: %s", exc)

    # 2. Try OpenAI API
    if provider == 'openai' and api_key and api_key != 'your_api_key':
        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=getattr(settings, 'AI_MODEL', 'gpt-4o-mini'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3
            )
            ans = response.choices[0].message.content
            if ans:
                return ans.strip()
        except Exception as exc:
            logger.warning("OpenAI Chat query failed: %s", exc)

    # 3. Contextual Heuristic Answer Engine (Ensures reliable answers without API keys)
    return _generate_contextual_answer(scan_record, user_message)


def _generate_contextual_answer(scan_record, user_message: str) -> str:
    """
    Intelligent rule-based security answers grounded directly in the scan report.
    Answers common user questions accurately and informatively.
    """
    msg = user_message.lower()
    score = scan_record.risk_score
    level = scan_record.risk_level
    domain = scan_record.domain
    ssl = scan_record.ssl_status
    phishing = scan_record.phishing_detected
    malware = scan_record.malware_detected
    redirects = scan_record.suspicious_redirects
    age = scan_record.domain_age

    # Question: Why did it get this score?
    if 'score' in msg or 'why' in msg and ('get' in msg or 'receive' in msg):
        reasons = []
        if ssl:
            reasons.append("a valid SSL/TLS certificate was present")
        else:
            reasons.append("SSL encryption was missing or invalid (-25 points)")

        if not phishing and not malware:
            reasons.append("no major phishing or malware indicators were detected")
        else:
            if phishing:
                reasons.append("suspicious phishing / credential harvesting markers were flagged")
            if malware:
                reasons.append("malicious script patterns were flagged")

        if age != "Unknown":
            reasons.append(f"the domain registration age is {age}")

        if redirects:
            reasons.append("suspicious redirects were observed")

        summary_reason = "; ".join(reasons)
        return (
            f"The website '{domain}' received a safety score of {score}/100 ({level} risk) because {summary_reason}. "
            f"Based on our inspection, {scan_record.security_summary}"
        )

    # Question: Is it safe?
    if 'is this website safe' in msg or 'is it safe' in msg or 'safe' in msg:
        if level == 'LOW':
            return (
                f"The website '{domain}' shows a low risk level (Score: {score}/100) based on automated technical checks. "
                f"No deceptive phishing or malware indicators were identified, and SSL encryption is active. "
                f"However, no website is guaranteed to be 100% safe, so remain vigilant and verify the URL before entering credentials."
            )
        elif level == 'MEDIUM':
            return (
                f"Caution is advised. '{domain}' received a moderate risk score ({score}/100). "
                f"While not confirmed malicious, certain cautionary signals like domain age ({age}) or redirect behavior suggest you should proceed with care."
            )
        else:
            return (
                f"No, this website is considered {level} risk with a low safety score of {score}/100. "
                f"High-threat indicators were detected. We strongly advise against visiting or interacting with this site."
            )

    # Question: Phishing indicators?
    if 'phishing' in msg:
        if phishing:
            return (
                f"Yes, phishing indicators were flagged for '{domain}'. "
                f"This includes suspicious form configurations, brand impersonation in the URL, or known deceptive phrasing. "
                f"Do not enter passwords or personal identity information."
            )
        else:
            return (
                f"No overt phishing indicators were detected on '{domain}' during this scan. "
                f"The login forms and URL structures did not match known deceptive phishing templates."
            )

    # Question: Entering personal information / credit card / passwords
    if any(k in msg for k in ('personal information', 'password', 'credit card', 'banking', 'card')):
        if not ssl:
            return (
                f"You should NOT enter personal or financial information on '{domain}'. "
                f"The site does not have active SSL encryption, meaning any submitted data can be intercepted by third parties."
            )
        if level in ('HIGH', 'CRITICAL') or phishing:
            return (
                f"Do NOT enter personal or payment details on '{domain}'. "
                f"The website received a high risk rating ({score}/100) with potential deceptive indicators."
            )
        return (
            f"While '{domain}' received a safety score of {score}/100 ({level} risk) with active SSL, "
            f"we recommend double-checking the exact address bar URL and verifying the merchant or service provider independently before providing sensitive data."
        )

    # Question: Explain in simple terms
    if 'simple' in msg or 'explain' in msg:
        return (
            f"In simple words: We analyzed '{domain}'. Its safety score is {score} out of 100 ({level} risk). "
            f"SSL security is {'active' if ssl else 'missing'}. "
            f"Phishing was {'detected' if phishing else 'not detected'}. "
            f"Domain age is {age}. "
            f"Summary: {scan_record.security_summary}"
        )

    # General fallback
    return (
        f"Based on the technical scan for '{domain}' (Scan #{scan_record.id}, Score: {score}/100, {level} Risk): "
        f"{scan_record.security_summary} Domain registration age is {age}, and SSL status is {'Active' if ssl else 'Inactive'}."
    )
