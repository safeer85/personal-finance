from rest_framework import serializers
from .models import Transaction, TransactionLine, TxnType, LineDirection
from decimal import Decimal

class TransactionLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionLine
        fields = [
            "id","account","category","direction",
            "currency","amount","fx_rate_to_base","amount_base","memo"
        ]

class TransactionSerializer(serializers.ModelSerializer):
    lines = TransactionLineSerializer(many=True)
    tag_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = Transaction
        fields = ["id","type","occurred_at","merchant","note","tag_ids","lines"]

    def validate(self, data):
        txn_type = data["type"]
        lines = data.get("lines", [])
        if not lines:
            raise serializers.ValidationError("Transaction must have at least 1 line.")

        # basic amount checks
        for ln in lines:
            if Decimal(ln["amount"]) <= 0:
                raise serializers.ValidationError("Line amount must be > 0.")
            if ln["currency"] == "LKR" and Decimal(ln.get("fx_rate_to_base", 1)) != 1:
                raise serializers.ValidationError("LKR lines must have fx_rate_to_base = 1.")

        # transfer rule: should have at least 2 lines and both accounts
        if txn_type == TxnType.TRANSFER:
            if len(lines) < 2:
                raise serializers.ValidationError("Transfer must have at least 2 lines.")
            for ln in lines:
                if not ln.get("account"):
                    raise serializers.ValidationError("Transfer lines must include account.")
                if ln.get("category"):
                    raise serializers.ValidationError("Transfer lines should not use category.")

        # income/expense must include categories on split lines
        if txn_type in (TxnType.INCOME, TxnType.EXPENSE):
            # allow one "account" line and multiple "category" lines
            if not any(ln.get("category") for ln in lines):
                raise serializers.ValidationError("Income/Expense must include at least one category line.")

        return data

    def create(self, validated):
        request = self.context["request"]
        user = request.user
        lines = validated.pop("lines")
        tag_ids = validated.pop("tag_ids", [])

        txn = Transaction.objects.create(user=user, **validated)
        for ln in lines:
            TransactionLine.objects.create(
                transaction=txn,
                user=user,
                **ln
            )

        if tag_ids:
            txn.tags.set(tag_ids)

        return txn
