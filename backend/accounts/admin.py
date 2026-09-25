from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


class CustomUserAdmin(DefaultUserAdmin):
    """
    Customized User admin showing Username, Email, and Date joined as requested.
    """
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'date_joined', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)


# Re-register UserAdmin with our customized version
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
