from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    image = models.FileField(upload_to="categories/", blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Brand(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    image = models.FileField(upload_to="brands/", blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Color(TimeStampedModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=7)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="products")
    colors = models.ManyToManyField(Color, related_name="products", blank=True)
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    sku = models.CharField(max_length=64, unique=True)
    short_description = models.TextField(blank=True)
    specification = models.TextField(blank=True)
    image = models.FileField(upload_to="products/cover/", blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now)
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title

    @property
    def price_with_tax(self):
        return self.price + self.tax

    @property
    def active_discount(self):
        discount = getattr(self, "discount", None)
        if discount and discount.is_currently_valid:
            return discount
        return None

    @property
    def discount_amount(self):
        discount = self.active_discount
        if not discount:
            return Decimal("0.00")
        if discount.discount_type == ProductDiscount.DiscountType.PERCENT:
            return (self.price_with_tax * discount.value / Decimal("100")).quantize(Decimal("0.01"))
        return min(discount.value, self.price_with_tax).quantize(Decimal("0.01"))

    @property
    def final_price(self):
        return (self.price_with_tax - self.discount_amount).quantize(Decimal("0.01"))


class ProductColorVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="color_variants")
    color_reference = models.ForeignKey(Color, on_delete=models.CASCADE, related_name="color_variants")
    display_name = models.CharField(max_length=100)
    image = models.FileField(upload_to="products/colors/")
    alt_text = models.CharField(max_length=255, blank=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.title} - {self.display_name}"


class ProductOptionGroup(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="option_groups")
    title = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.title} - {self.title}"


class ProductOptionValue(TimeStampedModel):
    group = models.ForeignKey(ProductOptionGroup, on_delete=models.CASCADE, related_name="values")
    label = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.label


class ProductFreeItem(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="free_items")
    image = models.FileField(upload_to="products/free-items/")
    text = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.text


class ProductDiscount(TimeStampedModel):
    class DiscountType(models.TextChoices):
        PERCENT = "PERCENT", "Percent"
        FIXED = "FIXED", "Fixed"

    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="discount")
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    active_from = models.DateTimeField()
    active_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.title} - {self.discount_type}"

    @property
    def is_currently_valid(self):
        now = timezone.now()
        return self.is_active and self.active_from <= now <= self.active_until


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.FileField(upload_to="products/images/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_feature = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"Image #{self.pk} - {self.product.title}"


class ProductVideo(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="videos")
    video_file = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Video #{self.pk} - {self.product.title}"


class UserProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=30, blank=True)
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class EmailOTP(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_otps")
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.code}"

    @property
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
