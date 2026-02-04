import uuid
from django.conf import settings
from django.db import models
from core.models import Currency, Account, Category, Merchant, Tag

class TxnType(models.TextChoices):
    INCOME = "INCOME", "Income"
    EXPENSE = "EXPENSE", "Expense"
    TRANSFER = "TRANSFER", "Transfer"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"

class LineDirection(models.TextChoices):
    DEBIT = "DEBIT", "Debit"
    CREDIT = "CREDIT", "Credit"

class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    type = models.CharField(max_length=12, choices=TxnType.choices)
    occurred_at = models.DateTimeField()

    merchant = models.ForeignKey(Merchant, null=True, blank=True, on_delete=models.SET_NULL)
    note = models.TextField(blank=True)

    tags = models.ManyToManyField(Tag, blank=True, related_name="transactions")

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TransactionLine(models.Model):
    """
    Supports:
    - splits: multiple lines with different category_id
    - transfers: two lines (from + to), possibly different currencies/rates
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="lines")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)

    direction = models.CharField(max_length=6, choices=LineDirection.choices)

    currency = models.CharField(max_length=3, choices=Currency.choices)
    amount = models.DecimalField(max_digits=18, decimal_places=2)

    fx_rate_to_base = models.DecimalField(max_digits=18, decimal_places=8, default=1)
    amount_base = models.DecimalField(max_digits=18, decimal_places=2)

    memo = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

