from apps.platform_admin.application.services import PlatformAdminService


def get_platform_admin_service() -> PlatformAdminService:
    return PlatformAdminService()
