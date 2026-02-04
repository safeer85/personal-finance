from django.db import models

import uuid
from django.conf import settings


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Currency(models.TextChoices):
    LKR = "LKR", "LKR"
    USD = "USD", "USD"

class AccountType(models.TextChoices):
    BANK = "BANK", "Bank"
    EWALLET = "EWALLET", "E-Wallet"
    FOREX = "FOREX", "Forex"
    CREDIT_CARD = "CREDIT_CARD", "Credit Card"
    PERSON_DEBT = "PERSON_DEBT", "Person Debt"

class AccountNature(models.TextChoices):
    ASSET = "ASSET", "Asset"
    LIABILITY = "LIABILITY", "Liability"

class Person(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Account(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20, choices=AccountType.choices)
    nature = models.CharField(max_length=10, choices=AccountNature.choices)

    default_currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.LKR)
    is_multi_currency = models.BooleanField(default=False)

    institution = models.CharField(max_length=120, blank=True)
    opened_on = models.DateField(null=True, blank=True)

    # for PERSON_DEBT accounts
    person = models.ForeignKey(Person, null=True, blank=True, on_delete=models.SET_NULL)
    debt_direction = models.CharField(
        max_length=20, blank=True,
        help_text="THEY_OWE_ME or I_OWE_THEM (only for PERSON_DEBT)"
    )

    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Category(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    name = models.CharField(max_length=120)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL)

    kind = models.CharField(max_length=10, default="BOTH")  # INCOME/EXPENSE/BOTH
    is_system = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "name", "parent")

    def __str__(self):
        return self.name

class Tag(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=60)

    class Meta:
        unique_together = ("user", "name")

    def __str__(self):
        return self.name

class Merchant(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)

    class Meta:
        unique_together = ("user", "name")

    def __str__(self):
        return self.name

