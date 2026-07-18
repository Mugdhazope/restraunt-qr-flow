from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from kotak.dashboard.api.views import CampaignViewSet
from kotak.dashboard.api.views import CustomerViewSet
from kotak.dashboard.api.views import DashboardViewSet
from kotak.dashboard.api.views import FeedbackViewSet
from kotak.dashboard.api.views import AutomationRuleViewSet
from kotak.dashboard.api.views import MenuCategoryViewSet
from kotak.dashboard.api.views import MenuItemViewSet
from kotak.dashboard.api.views import MessageTemplateViewSet
from kotak.dashboard.api.views import RestaurantViewSet
from kotak.dashboard.api.views import TeamMembershipViewSet
from kotak.layouts.views import LayoutAssetUploadView
from kotak.layouts.views import PageLayoutViewSet
from kotak.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)
router.register("dashboard", DashboardViewSet, basename="dashboard")
router.register("customers", CustomerViewSet, basename="customers")
router.register("feedback", FeedbackViewSet, basename="feedback")
router.register("campaigns", CampaignViewSet, basename="campaigns")
router.register("automations", AutomationRuleViewSet, basename="automations")
router.register("restaurants", RestaurantViewSet, basename="restaurants")
router.register(
    "message-templates",
    MessageTemplateViewSet,
    basename="message-templates",
)
router.register("team", TeamMembershipViewSet, basename="team")
router.register("menu/categories", MenuCategoryViewSet, basename="menu-categories")
router.register("menu/items", MenuItemViewSet, basename="menu-items")

_layouts = PageLayoutViewSet.as_view({"get": "list"})
_layout_page = PageLayoutViewSet.as_view({"get": "retrieve_page", "put": "upsert"})
_layout_reset = PageLayoutViewSet.as_view({"post": "reset"})
_layout_default = PageLayoutViewSet.as_view({"get": "default_template"})
_layout_assets = LayoutAssetUploadView.as_view()

app_name = "api"
urlpatterns = [
    *router.urls,
    path("layouts/pages/", _layouts, name="layouts-pages"),
    path("layouts/", _layout_page, name="layouts-page"),
    path("layouts/reset/", _layout_reset, name="layouts-reset"),
    path("layouts/default/", _layout_default, name="layouts-default"),
    path("layouts/assets/", _layout_assets, name="layouts-assets"),
]
