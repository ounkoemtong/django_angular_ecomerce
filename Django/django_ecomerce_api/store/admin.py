from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import (
    Brand,
    Category,
    Color,
    EmailOTP,
    Product,
    ProductColorVariant,
    ProductDiscount,
    ProductFreeItem,
    ProductImage,
    ProductOptionGroup,
    ProductOptionValue,
    ProductVideo,
    UserProfile,
)


class ProductColorVariantInline(admin.TabularInline):
    model = ProductColorVariant
    extra = 0


class ProductOptionValueInline(admin.TabularInline):
    model = ProductOptionValue
    extra = 0


class ProductOptionGroupInline(admin.StackedInline):
    model = ProductOptionGroup
    extra = 0


class ProductFreeItemInline(admin.TabularInline):
    model = ProductFreeItem
    extra = 0


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductVideoInline(admin.TabularInline):
    model = ProductVideo
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "sku", "price", "is_active", "is_featured")
    list_filter = ("is_active", "is_featured", "is_digital", "brand", "category")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "sku", "name")
    filter_horizontal = ("colors",)
    inlines = (
        ProductColorVariantInline,
        ProductOptionGroupInline,
        ProductFreeItemInline,
        ProductImageInline,
        ProductVideoInline,
    )


@admin.register(ProductOptionGroup)
class ProductOptionGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "product", "sort_order")
    inlines = (ProductOptionValueInline,)


@admin.register(ProductDiscount)
class ProductDiscountAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "discount_type", "value", "is_active")


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0


admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ("id", "username", "email", "is_staff", "is_active")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "code", "expires_at", "is_used", "created_at")
    list_filter = ("is_used",)
    search_fields = ("user__username", "user__email", "code")


admin.site.register(Category)
admin.site.register(Brand)
admin.site.register(Color)
