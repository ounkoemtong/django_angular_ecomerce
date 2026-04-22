import json
import logging
import random
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, Max, Min, Q
from django.db.models.fields.files import FieldFile
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

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

logger = logging.getLogger(__name__)


def isoformat_z(value):
    return value.isoformat().replace("+00:00", "Z")


def decimal_to_string(value):
    return f"{value:.2f}"


def parse_json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON body.")


def parse_request_payload(request):
    content_type = request.content_type or ""
    if "application/json" in content_type:
        return parse_json_body(request)

    payload = {}
    raw_payload = request.POST.get("payload")
    if raw_payload:
        try:
            payload = json.loads(raw_payload)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in 'payload' field.")
    else:
        for key in request.POST:
            values = request.POST.getlist(key)
            payload[key] = values if len(values) > 1 else values[0]

    for key, uploaded_file in request.FILES.items():
        payload[key] = uploaded_file
    return payload


def json_error(message, status=400):
    return JsonResponse({"detail": message}, status=status)


def media_value(file_value):
    if isinstance(file_value, FieldFile):
        if not file_value:
            return ""
        return file_value.url
    return file_value or ""


def get_user_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def require_auth(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required.", 401)
    return None


def require_staff(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error
    if not request.user.is_staff:
        return json_error("Staff access required.", 403)
    return None


def parse_api_datetime(value, field_name):
    parsed = parse_datetime(value)
    if parsed is None:
        raise ValueError(f"Invalid datetime for '{field_name}'. Use ISO 8601 format.")
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def set_model_fields(instance, payload, field_names):
    for field in field_names:
        if field in payload:
            setattr(instance, field, payload[field])


def serialize_category(category):
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "image": media_value(category.image),
        "created_at": isoformat_z(category.created_at),
        "updated_at": isoformat_z(category.updated_at),
    }


def serialize_brand(brand):
    return {
        "id": brand.id,
        "name": brand.name,
        "slug": brand.slug,
        "image": media_value(brand.image),
        "created_at": isoformat_z(brand.created_at),
        "updated_at": isoformat_z(brand.updated_at),
    }


def serialize_color(color):
    return {
        "id": color.id,
        "name": color.name,
        "code": color.code,
        "created_at": isoformat_z(color.created_at),
        "updated_at": isoformat_z(color.updated_at),
    }


def serialize_option_value(value):
    return {
        "id": value.id,
        "label": value.label,
        "price": decimal_to_string(value.price),
        "sort_order": value.sort_order,
        "created_at": isoformat_z(value.created_at),
        "updated_at": isoformat_z(value.updated_at),
    }


def serialize_product(product):
    discount = getattr(product, "discount", None)
    return {
        "id": product.id,
        "category": product.category_id,
        "category_name": product.category.name,
        "brand": product.brand_id,
        "brand_name": product.brand.name,
        "colors": list(product.colors.values_list("id", flat=True)),
        "name": product.name,
        "title": product.title,
        "slug": product.slug,
        "sku": product.sku,
        "short_description": product.short_description,
        "specification": product.specification,
        "image": media_value(product.image),
        "price": decimal_to_string(product.price),
        "tax": decimal_to_string(product.tax),
        "price_with_tax": decimal_to_string(product.price_with_tax),
        "final_price": decimal_to_string(product.final_price),
        "discount_amount": decimal_to_string(product.discount_amount),
        "color_variants": [
            {
                "id": variant.id,
                "product": variant.product_id,
                "color_reference": variant.color_reference_id,
                "color_name": variant.color_reference.name,
                "display_name": variant.display_name,
                "color_code": variant.color_reference.code,
                "image": media_value(variant.image),
                "alt_text": variant.alt_text,
                "price_adjustment": decimal_to_string(variant.price_adjustment),
                "sort_order": variant.sort_order,
                "is_active": variant.is_active,
                "created_at": isoformat_z(variant.created_at),
            }
            for variant in product.color_variants.all()
        ],
        "option_groups": [
            {
                "id": group.id,
                "product": group.product_id,
                "title": group.title,
                "sort_order": group.sort_order,
                "values": [serialize_option_value(value) for value in group.values.all()],
                "created_at": isoformat_z(group.created_at),
                "updated_at": isoformat_z(group.updated_at),
            }
            for group in product.option_groups.all()
        ],
        "free_items": [
            {
                "id": item.id,
                "product": item.product_id,
                "image": media_value(item.image),
                "text": item.text,
                "sort_order": item.sort_order,
                "is_active": item.is_active,
                "created_at": isoformat_z(item.created_at),
                "updated_at": isoformat_z(item.updated_at),
            }
            for item in product.free_items.all()
        ],
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "is_digital": product.is_digital,
        "published_at": isoformat_z(product.published_at),
        "meta_title": product.meta_title,
        "meta_description": product.meta_description,
        "discount": (
            {
                "id": discount.id,
                "product": discount.product_id,
                "discount_type": discount.discount_type,
                "value": decimal_to_string(discount.value),
                "active_from": isoformat_z(discount.active_from),
                "active_until": isoformat_z(discount.active_until),
                "is_active": discount.is_active,
                "is_currently_valid": discount.is_currently_valid,
                "created_at": isoformat_z(discount.created_at),
                "updated_at": isoformat_z(discount.updated_at),
            }
            if discount
            else None
        ),
        "images": [
            {
                "id": image.id,
                "product": image.product_id,
                "image": media_value(image.image),
                "alt_text": image.alt_text,
                "is_feature": image.is_feature,
                "sort_order": image.sort_order,
                "is_active": image.is_active,
                "created_at": isoformat_z(image.created_at),
            }
            for image in product.images.all()
        ],
        "videos": [
            {
                "id": video.id,
                "product": video.product_id,
                "video_file": video.video_file,
                "is_active": video.is_active,
                "created_at": isoformat_z(video.created_at),
            }
            for video in product.videos.all()
        ],
        "created_at": isoformat_z(product.created_at),
        "updated_at": isoformat_z(product.updated_at),
    }


def serialize_profile(user):
    profile = get_user_profile(user)
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": profile.phone,
        "email_verified": profile.email_verified,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "date_joined": isoformat_z(user.date_joined),
    }


def money_value(value):
    try:
        return decimal_to_string(Decimal(str(value)))
    except Exception:
        return str(value or "0.00")


def order_item_line(item):
    product = item.get("product") or {}
    quantity = item.get("quantity", 1)
    name = product.get("name") or product.get("title") or "Product"
    sku = product.get("sku")
    price = money_value(product.get("price", "0.00"))
    sku_text = f" ({sku})" if sku else ""
    return f"- {name}{sku_text} x {quantity} @ ${price}"


def build_order_notification(order, user):
    profile = get_user_profile(user)
    pricing = order.get("pricing") or {}
    shipping = order.get("shippingAddress") or {}
    items = order.get("items") or []
    item_lines = [order_item_line(item) for item in items[:12]]
    if len(items) > 12:
        item_lines.append(f"- ...and {len(items) - 12} more item(s)")
    if not item_lines:
        item_lines = ["- No items received"]

    customer_name = shipping.get("fullName") or [user.first_name, user.last_name]
    if isinstance(customer_name, list):
        customer_name = " ".join(part for part in customer_name if part) or user.username

    address_parts = [
        shipping.get("address"),
        shipping.get("city"),
        shipping.get("zipCode"),
        shipping.get("country"),
    ]
    address = ", ".join(str(part) for part in address_parts if part) or "Not provided"
    payment_method = str(order.get("paymentMethod", "")).lower()
    title = "New order" if payment_method == "cash-on-delivery" else "New paid order"

    lines = [
        title,
        f"Order ID: {order.get('id', 'N/A')}",
        f"Account: {user.username} (ID {user.id})",
        f"Name: {customer_name}",
        f"Email: {order.get('customerEmail') or user.email or 'Not provided'}",
        f"Phone: {order.get('customerPhone') or profile.phone or 'Not provided'}",
        f"Payment: {order.get('paymentMethod', 'Not provided')}",
        f"Status: {order.get('status', 'Confirmed')}",
        "",
        "Items:",
        *item_lines,
        "",
        f"Subtotal: ${money_value(pricing.get('subtotal', '0.00'))}",
        f"Shipping: ${money_value(pricing.get('shipping', '0.00'))}",
        f"Tax: ${money_value(pricing.get('tax', '0.00'))}",
        f"Total: ${money_value(pricing.get('total', '0.00'))}",
        "",
        f"Ship to: {address}",
    ]
    return "\n".join(lines)


def send_telegram_message(text):
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    chat_id = getattr(settings, "TELEGRAM_ORDER_CHAT_ID", "")
    if not token or not chat_id:
        return False, "Telegram bot token or chat ID is not configured."

    api_url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = urlencode({"chat_id": chat_id, "text": text}).encode()
    request = Request(api_url, data=body, method="POST")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urlopen(request, timeout=5) as response:
            if 200 <= response.status < 300:
                return True, "Telegram message sent."
            return False, f"Telegram returned HTTP {response.status}."
    except URLError:
        logger.exception("Could not send Telegram order notification.")
        return False, "Could not connect to Telegram."


def create_email_otp(user):
    EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)
    otp = EmailOTP.objects.create(
        user=user,
        code=f"{random.randint(0, 999999):06d}",
        expires_at=timezone.now() + timezone.timedelta(minutes=10),
    )
    send_mail(
        subject="Your verification code",
        message=f"Your OTP code is {otp.code}. It expires in 10 minutes.",
        from_email=None,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return otp


def build_product_queryset():
    return Product.objects.select_related("category", "brand").prefetch_related(
        "colors",
        "color_variants__color_reference",
        "option_groups__values",
        "free_items",
        "images",
        "videos",
    )


def replace_product_relations(product, payload):
    if "color_variants" in payload:
        product.color_variants.all().delete()
        for item in payload["color_variants"]:
            ProductColorVariant.objects.create(
                product=product,
                color_reference_id=item["color_reference"],
                display_name=item["display_name"],
                image=item["image"],
                alt_text=item.get("alt_text", ""),
                price_adjustment=item.get("price_adjustment", "0.00"),
                sort_order=item.get("sort_order", 0),
                is_active=item.get("is_active", True),
            )

    if "option_groups" in payload:
        product.option_groups.all().delete()
        for group_data in payload["option_groups"]:
            group = ProductOptionGroup.objects.create(
                product=product,
                title=group_data["title"],
                sort_order=group_data.get("sort_order", 0),
            )
            for value_data in group_data.get("values", []):
                ProductOptionValue.objects.create(
                    group=group,
                    label=value_data["label"],
                    price=value_data.get("price", "0.00"),
                    sort_order=value_data.get("sort_order", 0),
                )

    if "free_items" in payload:
        product.free_items.all().delete()
        for item in payload["free_items"]:
            ProductFreeItem.objects.create(
                product=product,
                image=item["image"],
                text=item["text"],
                sort_order=item.get("sort_order", 0),
                is_active=item.get("is_active", True),
            )

    if "images" in payload:
        product.images.all().delete()
        for item in payload["images"]:
            ProductImage.objects.create(
                product=product,
                image=item["image"],
                alt_text=item.get("alt_text", ""),
                is_feature=item.get("is_feature", False),
                sort_order=item.get("sort_order", 0),
                is_active=item.get("is_active", True),
            )

    if "videos" in payload:
        product.videos.all().delete()
        for item in payload["videos"]:
            ProductVideo.objects.create(
                product=product,
                video_file=item["video_file"],
                is_active=item.get("is_active", True),
            )

    if "discount" in payload:
        discount_data = payload["discount"]
        if discount_data is None:
            ProductDiscount.objects.filter(product=product).delete()
        else:
            discount = ProductDiscount.objects.filter(product=product).first()
            if discount is None:
                discount = ProductDiscount(product=product)
            discount.discount_type = discount_data["discount_type"]
            discount.value = discount_data["value"]
            discount.active_from = parse_api_datetime(discount_data["active_from"], "active_from")
            discount.active_until = parse_api_datetime(discount_data["active_until"], "active_until")
            discount.is_active = discount_data.get("is_active", True)
            discount.save()


def create_or_update_product(payload, product=None):
    required_fields = ["category", "brand", "name", "title", "slug", "sku", "price"]
    if product is None:
        missing = [field for field in required_fields if field not in payload]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}.")

    creating = product is None
    if creating:
        product = Product()

    if "category" in payload:
        product.category_id = payload["category"]
    if "brand" in payload:
        product.brand_id = payload["brand"]

    set_model_fields(
        product,
        payload,
        [
            "name",
            "title",
            "slug",
            "sku",
            "short_description",
            "specification",
            "image",
            "price",
            "tax",
            "is_active",
            "is_featured",
            "is_digital",
            "meta_title",
            "meta_description",
        ],
    )

    if "published_at" in payload:
        product.published_at = parse_api_datetime(payload["published_at"], "published_at")

    product.save()

    if "colors" in payload:
        product.colors.set(payload["colors"])
    elif creating:
        product.colors.set([])

    replace_product_relations(product, payload)
    return product


class JsonView(View):
    def parse_body(self, request):
        return parse_request_payload(request)


@method_decorator(csrf_exempt, name="dispatch")
class ProductListView(JsonView):
    def get(self, request):
        products = build_product_queryset().all()
        return JsonResponse([serialize_product(product) for product in products], safe=False)

    def post(self, request):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        try:
            payload = self.parse_body(request)
            with transaction.atomic():
                product = create_or_update_product(payload)
        except ValueError as exc:
            return json_error(str(exc))
        return JsonResponse(serialize_product(build_product_queryset().get(pk=product.pk)), status=201)


@method_decorator(csrf_exempt, name="dispatch")
class ProductDetailBySlugView(JsonView):
    def get(self, request, slug):
        product = get_object_or_404(build_product_queryset(), slug=slug)
        return JsonResponse(serialize_product(product))


@method_decorator(csrf_exempt, name="dispatch")
class ProductManageDetailView(JsonView):
    def put(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        product = get_object_or_404(Product, pk=pk)
        try:
            payload = self.parse_body(request)
            with transaction.atomic():
                create_or_update_product(payload, product=product)
        except ValueError as exc:
            return json_error(str(exc))
        return JsonResponse(serialize_product(build_product_queryset().get(pk=pk)))

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        product = get_object_or_404(Product, pk=pk)
        product.delete()
        return JsonResponse({}, status=204)


class StaffModelMixin:
    model = None
    serializer = None
    field_map = {}

    def serialize(self, instance):
        return self.serializer(instance)

    def parse_payload(self, payload, partial=False):
        if not partial:
            missing = [key for key in self.field_map if self.field_map[key].get("required")]
            missing = [key for key in missing if key not in payload]
            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}.")

        cleaned = {}
        for key, options in self.field_map.items():
            if key not in payload:
                continue
            value = payload[key]
            if value is None and not options.get("allow_null", False):
                raise ValueError(f"'{key}' cannot be null.")
            transform = options.get("transform")
            cleaned[key] = transform(value, key) if transform else value
        return cleaned


@method_decorator(csrf_exempt, name="dispatch")
class StaffEntityListCreateView(JsonView, StaffModelMixin):
    def get(self, request):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        return JsonResponse([self.serialize(obj) for obj in self.model.objects.all()], safe=False)

    def post(self, request):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        try:
            payload = self.parse_payload(self.parse_body(request))
        except ValueError as exc:
            return json_error(str(exc))
        instance = self.model.objects.create(**payload)
        return JsonResponse(self.serialize(instance), status=201)


@method_decorator(csrf_exempt, name="dispatch")
class StaffEntityDetailView(JsonView, StaffModelMixin):
    def get_object(self, pk):
        return get_object_or_404(self.model, pk=pk)

    def get(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        return JsonResponse(self.serialize(self.get_object(pk)))

    def put(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        instance = self.get_object(pk)
        try:
            payload = self.parse_payload(self.parse_body(request))
        except ValueError as exc:
            return json_error(str(exc))
        for key, value in payload.items():
            setattr(instance, key, value)
        instance.save()
        return JsonResponse(self.serialize(instance))

    def patch(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        instance = self.get_object(pk)
        try:
            payload = self.parse_payload(self.parse_body(request), partial=True)
        except ValueError as exc:
            return json_error(str(exc))
        for key, value in payload.items():
            setattr(instance, key, value)
        instance.save()
        return JsonResponse(self.serialize(instance))

    def delete(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        self.get_object(pk).delete()
        return JsonResponse({}, status=204)


class CategoryListCreateView(StaffEntityListCreateView):
    model = Category
    serializer = staticmethod(serialize_category)
    field_map = {
        "name": {"required": True},
        "slug": {"required": True},
        "image": {"required": False},
    }


class CategoryDetailView(StaffEntityDetailView):
    model = Category
    serializer = staticmethod(serialize_category)
    field_map = CategoryListCreateView.field_map


class BrandListCreateView(StaffEntityListCreateView):
    model = Brand
    serializer = staticmethod(serialize_brand)
    field_map = {
        "name": {"required": True},
        "slug": {"required": True},
        "image": {"required": False},
    }


class BrandDetailView(StaffEntityDetailView):
    model = Brand
    serializer = staticmethod(serialize_brand)
    field_map = BrandListCreateView.field_map


class ColorListCreateView(StaffEntityListCreateView):
    model = Color
    serializer = staticmethod(serialize_color)
    field_map = {
        "name": {"required": True},
        "code": {"required": True},
    }


class ColorDetailView(StaffEntityDetailView):
    model = Color
    serializer = staticmethod(serialize_color)
    field_map = ColorListCreateView.field_map


def int_field(value, _field):
    return int(value)


def datetime_field(value, field):
    return parse_api_datetime(value, field)


def bool_field(value, field_name):
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "on"}:
        return True
    if normalized in {"false", "0", "no", "off"}:
        return False
    raise ValueError(f"Invalid boolean for '{field_name}'.")


def serialize_color_variant(variant):
    return {
        "id": variant.id,
        "product": variant.product_id,
        "color_reference": variant.color_reference_id,
        "display_name": variant.display_name,
        "image": media_value(variant.image),
        "alt_text": variant.alt_text,
        "price_adjustment": decimal_to_string(variant.price_adjustment),
        "sort_order": variant.sort_order,
        "is_active": variant.is_active,
        "created_at": isoformat_z(variant.created_at),
        "updated_at": isoformat_z(variant.updated_at),
    }


def serialize_option_group(group):
    return {
        "id": group.id,
        "product": group.product_id,
        "title": group.title,
        "sort_order": group.sort_order,
        "values": [serialize_option_value(value) for value in group.values.all()],
        "created_at": isoformat_z(group.created_at),
        "updated_at": isoformat_z(group.updated_at),
    }


def serialize_free_item(item):
    return {
        "id": item.id,
        "product": item.product_id,
        "image": media_value(item.image),
        "text": item.text,
        "sort_order": item.sort_order,
        "is_active": item.is_active,
        "created_at": isoformat_z(item.created_at),
        "updated_at": isoformat_z(item.updated_at),
    }


def serialize_discount(discount):
    return {
        "id": discount.id,
        "product": discount.product_id,
        "discount_type": discount.discount_type,
        "value": decimal_to_string(discount.value),
        "active_from": isoformat_z(discount.active_from),
        "active_until": isoformat_z(discount.active_until),
        "is_active": discount.is_active,
        "is_currently_valid": discount.is_currently_valid,
        "created_at": isoformat_z(discount.created_at),
        "updated_at": isoformat_z(discount.updated_at),
    }


def serialize_image(image):
    return {
        "id": image.id,
        "product": image.product_id,
        "image": media_value(image.image),
        "alt_text": image.alt_text,
        "is_feature": image.is_feature,
        "sort_order": image.sort_order,
        "is_active": image.is_active,
        "created_at": isoformat_z(image.created_at),
        "updated_at": isoformat_z(image.updated_at),
    }


def serialize_video(video):
    return {
        "id": video.id,
        "product": video.product_id,
        "video_file": video.video_file,
        "is_active": video.is_active,
        "created_at": isoformat_z(video.created_at),
        "updated_at": isoformat_z(video.updated_at),
    }


class ColorVariantListCreateView(StaffEntityListCreateView):
    model = ProductColorVariant
    serializer = staticmethod(serialize_color_variant)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "color_reference_id": {"required": True, "transform": int_field},
        "display_name": {"required": True},
        "image": {"required": True},
        "alt_text": {"required": False},
        "price_adjustment": {"required": False},
        "sort_order": {"required": False},
        "is_active": {"required": False, "transform": bool_field},
    }


class ColorVariantDetailView(StaffEntityDetailView):
    model = ProductColorVariant
    serializer = staticmethod(serialize_color_variant)
    field_map = ColorVariantListCreateView.field_map


class OptionGroupListCreateView(StaffEntityListCreateView):
    model = ProductOptionGroup
    serializer = staticmethod(serialize_option_group)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "title": {"required": True},
        "sort_order": {"required": False},
    }


class OptionGroupDetailView(StaffEntityDetailView):
    model = ProductOptionGroup
    serializer = staticmethod(serialize_option_group)
    field_map = OptionGroupListCreateView.field_map


class OptionValueListCreateView(StaffEntityListCreateView):
    model = ProductOptionValue
    serializer = staticmethod(serialize_option_value)
    field_map = {
        "group_id": {"required": True, "transform": int_field},
        "label": {"required": True},
        "price": {"required": False},
        "sort_order": {"required": False},
    }


class OptionValueDetailView(StaffEntityDetailView):
    model = ProductOptionValue
    serializer = staticmethod(serialize_option_value)
    field_map = OptionValueListCreateView.field_map


class FreeItemListCreateView(StaffEntityListCreateView):
    model = ProductFreeItem
    serializer = staticmethod(serialize_free_item)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "image": {"required": True},
        "text": {"required": True},
        "sort_order": {"required": False},
        "is_active": {"required": False, "transform": bool_field},
    }


class FreeItemDetailView(StaffEntityDetailView):
    model = ProductFreeItem
    serializer = staticmethod(serialize_free_item)
    field_map = FreeItemListCreateView.field_map


class DiscountListCreateView(StaffEntityListCreateView):
    model = ProductDiscount
    serializer = staticmethod(serialize_discount)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "discount_type": {"required": True},
        "value": {"required": True},
        "active_from": {"required": True, "transform": datetime_field},
        "active_until": {"required": True, "transform": datetime_field},
        "is_active": {"required": False},
    }


class DiscountDetailView(StaffEntityDetailView):
    model = ProductDiscount
    serializer = staticmethod(serialize_discount)
    field_map = DiscountListCreateView.field_map


class ImageListCreateView(StaffEntityListCreateView):
    model = ProductImage
    serializer = staticmethod(serialize_image)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "image": {"required": True},
        "alt_text": {"required": False},
        "is_feature": {"required": False, "transform": bool_field},
        "sort_order": {"required": False},
        "is_active": {"required": False, "transform": bool_field},
    }


class ImageDetailView(StaffEntityDetailView):
    model = ProductImage
    serializer = staticmethod(serialize_image)
    field_map = ImageListCreateView.field_map


class VideoListCreateView(StaffEntityListCreateView):
    model = ProductVideo
    serializer = staticmethod(serialize_video)
    field_map = {
        "product_id": {"required": True, "transform": int_field},
        "video_file": {"required": True},
        "is_active": {"required": False},
    }


class VideoDetailView(StaffEntityDetailView):
    model = ProductVideo
    serializer = staticmethod(serialize_video)
    field_map = VideoListCreateView.field_map


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(JsonView):
    def post(self, request):
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))

        required = ["username", "email", "password"]
        missing = [field for field in required if not payload.get(field)]
        if missing:
            return json_error(f"Missing required fields: {', '.join(missing)}.")

        if User.objects.filter(username=payload["username"]).exists():
            return json_error("Username already exists.")
        if User.objects.filter(email=payload["email"]).exists():
            return json_error("Email already exists.")

        user = User.objects.create_user(
            username=payload["username"],
            email=payload["email"],
            password=payload["password"],
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
        )
        profile = get_user_profile(user)
        profile.phone = payload.get("phone", "")
        profile.save()

        create_email_otp(user)
        login(request, user)
        return JsonResponse(
            {
                "message": "Account created. OTP sent to email.",
                "user": serialize_profile(user),
            },
            status=201,
        )


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(JsonView):
    def post(self, request):
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))
        username = payload.get("username") or payload.get("email")
        password = payload.get("password")
        if not username or not password:
            return json_error("Email or username and password are required.")

        if "@" in username:
            user_match = User.objects.filter(email__iexact=username).first()
            if user_match:
                username = user_match.username

        user = authenticate(request, username=username, password=password)
        if not user:
            return json_error("Invalid email, username, or password.", 401)

        login(request, user)
        return JsonResponse({"message": "Login successful.", "user": serialize_profile(user)})


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(JsonView):
    def post(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        logout(request)
        return JsonResponse({"message": "Logout successful."})


@method_decorator(csrf_exempt, name="dispatch")
class ProfileView(JsonView):
    def get(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        return JsonResponse(serialize_profile(request.user))

    def patch(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))

        user = request.user
        profile = get_user_profile(user)

        if "email" in payload and payload["email"] != user.email:
            if User.objects.exclude(pk=user.pk).filter(email=payload["email"]).exists():
                return json_error("Email already exists.")
            user.email = payload["email"]
            profile.email_verified = False
            create_email_otp(user)

        for field in ["first_name", "last_name"]:
            if field in payload:
                setattr(user, field, payload[field])
        if "phone" in payload:
            profile.phone = payload["phone"]
        if "password" in payload and payload["password"]:
            user.set_password(payload["password"])

        user.save()
        profile.save()
        if "password" in payload and payload["password"]:
            login(request, user)
        return JsonResponse(serialize_profile(user))


@method_decorator(csrf_exempt, name="dispatch")
class VerifyEmailOTPView(JsonView):
    def post(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))

        code = payload.get("code")
        if not code:
            return json_error("OTP code is required.")

        otp = request.user.email_otps.filter(code=code, is_used=False).order_by("-created_at").first()
        if not otp or not otp.is_valid:
            return json_error("OTP is invalid or expired.", 400)

        otp.is_used = True
        otp.save(update_fields=["is_used"])
        profile = get_user_profile(request.user)
        profile.email_verified = True
        profile.save(update_fields=["email_verified"])
        return JsonResponse({"message": "Email verified.", "user": serialize_profile(request.user)})


@method_decorator(csrf_exempt, name="dispatch")
class ResendOTPView(JsonView):
    def post(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        if not request.user.email:
            return json_error("User does not have an email address.")
        create_email_otp(request.user)
        return JsonResponse({"message": "OTP sent to email."})


@method_decorator(csrf_exempt, name="dispatch")
class OrderNotificationView(JsonView):
    def post(self, request):
        auth_error = require_auth(request)
        if auth_error:
            return auth_error
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))

        order = payload.get("order") if isinstance(payload.get("order"), dict) else payload
        if not order.get("items"):
            return json_error("Order items are required.")

        message = build_order_notification(order, request.user)
        sent, notification_message = send_telegram_message(message)
        return JsonResponse({"message": notification_message, "sent": sent})


@method_decorator(csrf_exempt, name="dispatch")
class UserListView(JsonView):
    def get(self, request):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        users = User.objects.select_related("profile").all().order_by("-date_joined")
        return JsonResponse([serialize_profile(user) for user in users], safe=False)


@method_decorator(csrf_exempt, name="dispatch")
class UserDetailView(JsonView):
    def get_object(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        return JsonResponse(serialize_profile(self.get_object(pk)))

    def patch(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        user = self.get_object(pk)
        profile = get_user_profile(user)
        try:
            payload = self.parse_body(request)
        except ValueError as exc:
            return json_error(str(exc))

        for field in ["username", "first_name", "last_name", "email", "is_active", "is_staff"]:
            if field in payload:
                setattr(user, field, payload[field])
        if "phone" in payload:
            profile.phone = payload["phone"]
        if "email_verified" in payload:
            profile.email_verified = payload["email_verified"]
        if "password" in payload and payload["password"]:
            user.set_password(payload["password"])

        user.save()
        profile.save()
        return JsonResponse(serialize_profile(user))

    def delete(self, request, pk):
        permission_error = require_staff(request)
        if permission_error:
            return permission_error
        self.get_object(pk).delete()
        return JsonResponse({}, status=204)
