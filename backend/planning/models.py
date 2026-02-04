import uuid
from django.conf import settings
from django.db import models
from core.models import Category, Account

class AlertSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    budget_warn_pct = models.IntegerField(default=80)
    budget_alert_pct = models.IntegerField(default=100)

class BudgetMonth(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    year = models.IntegerField()
    month = models.IntegerField()
    overall_limit_base = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ("user", "year", "month")

class BudgetCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    budget_month = models.ForeignKey(BudgetMonth, on_delete=models.CASCADE, related_name="category_budgets")
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    limit_base = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        unique_together = ("budget_month", "category")

class RecurringRule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    frequency = models.CharField(max_length=10)  # DAILY/WEEKLY/MONTHLY
    interval = models.IntegerField(default=1)
    day_of_month = models.IntegerField(null=True, blank=True)
    day_of_week = models.IntegerField(null=True, blank=True)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    template_json = models.JSONField()  # contains transaction template payload

    created_at = models.DateTimeField(auto_now_add=True)

class RecurringInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rule = models.ForeignKey(RecurringRule, on_delete=models.CASCADE, related_name="instances")
    scheduled_for = models.DateField()
    transaction_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=12, default="PENDING")  # PENDING/GENERATED/SKIPPED

    class Meta:
        unique_together = ("rule", "scheduled_for")

class SavingsGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    target_base = models.DecimalField(max_digits=18, decimal_places=2)
    current_base = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Bill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    amount_base = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    due_day = models.IntegerField(null=True, blank=True)  # 1-31
    frequency = models.CharField(max_length=10)  # MONTHLY/WEEKLY/YEARLY
    is_active = models.BooleanField(default=True)

    pay_from_account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

