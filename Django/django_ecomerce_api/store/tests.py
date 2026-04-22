import json
from pathlib import Path
import shutil
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.test.utils import override_settings
from django.urls import reverse
from django.utils import timezone

from .models import (
    Brand,
    Category,
    Color,
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

TEST_MEDIA_ROOT = Path(__file__).resolve().parent.parent / ".test_media"
TEST_MEDIA_ROOT.mkdir(exist_ok=True)


def tearDownModule():
    shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class BaseStoreTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(name="Phones", slug="phones", image="categories/phones.png")
        self.brand = Brand.objects.create(name="Apple", slug="apple", image="brands/apple.png")
        self.black = Color.objects.create(name="Black", code="#190600")
        self.white = Color.objects.create(name="white", code="#ffffff")

        self.product = Product.objects.create(
            category=self.category,
            brand=self.brand,
            name="iphone 12 pro max",
            title="iphone 12 pro max",
            slug="iphone-12-pro-max",
            sku="IPHONE12-97771A96",
            short_description="iphone 12 pro max",
            specification="<p><strong>iphone 12 pro max</strong></p>",
            image="products/cover/iphone-12.png",
            price="500.00",
            tax="0.00",
            is_active=True,
            is_digital=True,
            meta_title="iphone 12 pro max",
            meta_description="iphone 12 pro max best price in cambodia",
        )
        self.product.colors.set([self.black, self.white])

        ProductColorVariant.objects.create(
            product=self.product,
            color_reference=self.black,
            display_name="Black",
            image="products/colors/1.png",
            alt_text="Color Black",
            price_adjustment="0.00",
            sort_order=0,
        )
        group = ProductOptionGroup.objects.create(product=self.product, title="Choose Storage", sort_order=0)
        ProductOptionValue.objects.create(group=group, label="512 G", price="0.00", sort_order=0)
        ProductFreeItem.objects.create(
            product=self.product,
            image="products/free-items/1.png",
            text="Free charger",
        )
        ProductDiscount.objects.create(
            product=self.product,
            discount_type=ProductDiscount.DiscountType.PERCENT,
            value="10.00",
            active_from=timezone.now() - timezone.timedelta(hours=1),
            active_until=timezone.now() + timezone.timedelta(hours=1),
            is_active=True,
        )
        ProductImage.objects.create(
            product=self.product,
            image="products/images/1.png",
            sort_order=0,
            is_active=True,
        )
        ProductVideo.objects.create(
            product=self.product,
            video_file="http://127.0.0.1:8000/media/products/videos/1.mp4",
            is_active=True,
        )


class ProductApiTests(BaseStoreTestCase):
    def test_product_list_returns_nested_payload(self):
        response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, 200)

        payload = json.loads(response.content)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["title"], "iphone 12 pro max")
        self.assertEqual(payload[0]["image"], "/media/products/cover/iphone-12.png")
        self.assertEqual(payload[0]["discount_amount"], "50.00")
        self.assertEqual(payload[0]["final_price"], "450.00")
        self.assertEqual(len(payload[0]["color_variants"]), 1)
        self.assertTrue(payload[0]["discount"]["is_currently_valid"])

    def test_staff_can_create_product_with_nested_data(self):
        staff_user = User.objects.create_user("admin", "admin@example.com", "pass12345", is_staff=True)
        self.client.force_login(staff_user)
        response = self.client.post(
            reverse("product-list"),
            data=json.dumps(
                {
                    "category": self.category.id,
                    "brand": self.brand.id,
                    "colors": [self.black.id],
                    "name": "iphone 17 pro max",
                    "title": "iphone 17 pro max",
                    "slug": "iphone-17-pro-max",
                    "sku": "IPHONE17-40B62C7E",
                    "price": "1700.00",
                    "tax": "0.00",
                    "short_description": "iphone 17 pro max",
                    "specification": "<p><strong>iphone 17 pro max</strong></p>",
                    "is_active": True,
                    "is_digital": True,
                    "color_variants": [
                        {
                            "color_reference": self.black.id,
                            "display_name": "Black",
                            "image": "http://127.0.0.1:8000/media/products/colors/black.png",
                        }
                    ],
                    "option_groups": [
                        {
                            "title": "Choose Storage",
                            "values": [
                                {"label": "1 T", "price": "0.00"},
                                {"label": "2 T", "price": "200.00"},
                            ],
                        }
                    ],
                    "discount": {
                        "discount_type": "PERCENT",
                        "value": "10.00",
                        "active_from": "2026-04-01T09:00:00Z",
                        "active_until": "2026-04-01T09:05:00Z",
                        "is_active": True,
                    },
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.count(), 2)
        self.assertEqual(Product.objects.get(slug="iphone-17-pro-max").option_groups.first().values.count(), 2)

    def test_staff_can_create_product_with_multipart_cover_image(self):
        staff_user = User.objects.create_user("admin2", "admin2@example.com", "pass12345", is_staff=True)
        self.client.force_login(staff_user)
        response = self.client.post(
            reverse("product-list"),
            data={
                "payload": json.dumps(
                    {
                        "category": self.category.id,
                        "brand": self.brand.id,
                        "name": "iphone 18 pro",
                        "title": "iphone 18 pro",
                        "slug": "iphone-18-pro",
                        "sku": "IPHONE18-XYZ123",
                        "price": "1900.00",
                    }
                ),
                "image": SimpleUploadedFile("cover.jpg", b"fake-image-content", content_type="image/jpeg"),
            },
        )
        self.assertEqual(response.status_code, 201)
        created = Product.objects.get(slug="iphone-18-pro")
        self.assertTrue(created.image.name.startswith("products/cover/"))
        self.assertEqual(response.json()["image"], created.image.url)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class ImageEntityApiTests(BaseStoreTestCase):
    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user("admin3", "admin3@example.com", "StrongPass123", is_staff=True)
        self.client.force_login(self.staff)

    def test_staff_can_create_category_with_image_upload(self):
        response = self.client.post(
            reverse("manage-category-list"),
            data={
                "name": "Tablets",
                "slug": "tablets",
                "image": SimpleUploadedFile("tablets.png", b"tablet-image", content_type="image/png"),
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Category.objects.get(slug="tablets").image.name.startswith("categories/"))
        self.assertTrue(response.json()["image"].startswith("/media/categories/"))

    def test_staff_can_create_product_image_with_upload(self):
        response = self.client.post(
            reverse("manage-image-list"),
            data={
                "product_id": str(self.product.id),
                "alt_text": "Front",
                "is_feature": "true",
                "image": SimpleUploadedFile("front.png", b"front-image", content_type="image/png"),
            },
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertTrue(payload["image"].startswith("/media/products/images/"))
        self.assertTrue(payload["is_feature"])


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_register_creates_user_profile_and_sends_otp(self):
        response = self.client.post(
            reverse("auth-register"),
            data=json.dumps(
                {
                    "username": "sokha",
                    "email": "sokha@example.com",
                    "password": "StrongPass123",
                    "first_name": "Sokha",
                    "phone": "012345678",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="sokha")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("OTP code", mail.outbox[0].body)

    def test_verify_email_marks_profile_verified(self):
        user = User.objects.create_user(username="demo", email="demo@example.com", password="StrongPass123")
        self.client.force_login(user)

        self.client.post(reverse("auth-resend-otp"))
        otp = user.email_otps.first()
        response = self.client.post(
            reverse("auth-verify-email"),
            data=json.dumps({"code": otp.code}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.profile.email_verified)

    def test_login_accepts_email_or_username(self):
        User.objects.create_user(username="email-login", email="login@example.com", password="StrongPass123")
        response = self.client.post(
            reverse("auth-login"),
            data=json.dumps({"username": "login@example.com", "password": "StrongPass123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["username"], "email-login")


class OrderNotificationApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="StrongPass123",
            first_name="Customer",
            last_name="One",
        )
        self.user.profile.phone = "012345678"
        self.user.profile.save()
        self.order_payload = {
            "order": {
                "id": 12345,
                "items": [
                    {
                        "product": {
                            "name": "iphone 12 pro max",
                            "sku": "IPHONE12-97771A96",
                            "price": 450,
                        },
                        "quantity": 2,
                    }
                ],
                "pricing": {
                    "subtotal": 900,
                    "shipping": 0,
                    "tax": 72,
                    "total": 972,
                },
                "status": "Confirmed",
                "shippingAddress": {
                    "fullName": "Customer One",
                    "address": "Street 1",
                    "city": "Phnom Penh",
                    "zipCode": "12000",
                    "country": "Cambodia",
                },
                "customerEmail": "customer@example.com",
                "customerPhone": "012345678",
                "paymentMethod": "card",
            }
        }

    def test_order_notification_requires_login(self):
        response = self.client.post(
            reverse("order-notify"),
            data=json.dumps(self.order_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    @override_settings(TELEGRAM_BOT_TOKEN="test-token", TELEGRAM_ORDER_CHAT_ID="7125153160")
    @patch("store.views.urlopen")
    def test_order_notification_sends_telegram_message(self, mock_urlopen):
        response_context = MagicMock()
        response_context.__enter__.return_value.status = 200
        mock_urlopen.return_value = response_context
        self.client.force_login(self.user)

        response = self.client.post(
            reverse("order-notify"),
            data=json.dumps(self.order_payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["sent"])
        request = mock_urlopen.call_args.args[0]
        body = request.data.decode()
        self.assertIn("chat_id=7125153160", body)
        self.assertIn("New+paid+order", body)
        self.assertIn("Account%3A+customer+%28ID+", body)
        self.assertIn("Total%3A+%24972.00", body)

    @override_settings(TELEGRAM_BOT_TOKEN="", TELEGRAM_ORDER_CHAT_ID="7125153160")
    def test_order_notification_explains_missing_telegram_config(self):
        self.client.force_login(self.user)

        response = self.client.post(
            reverse("order-notify"),
            data=json.dumps(self.order_payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["sent"])
        self.assertIn("not configured", response.json()["message"])


class UserManagementApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="StrongPass123",
            is_staff=True,
        )
        self.user = User.objects.create_user(username="customer", email="customer@example.com", password="StrongPass123")
        self.user.profile.phone = "011111111"
        self.user.profile.save()

    def test_staff_can_list_users(self):
        self.client.force_login(self.staff)
        response = self.client.get(reverse("manage-user-list"))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 2)

    def test_staff_can_update_user(self):
        self.client.force_login(self.staff)
        response = self.client.patch(
            reverse("manage-user-detail", kwargs={"pk": self.user.pk}),
            data=json.dumps({"is_active": False, "email_verified": True}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertTrue(self.user.profile.email_verified)
