from rest_framework import serializers
from .models import Budget
from transactions.models import Transaction
from django.db.models import Sum

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    usage_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = (
            'id', 'user', 'category', 'category_name', 'amount',
            'start_date', 'end_date', 'spent', 'remaining', 'usage_percent',
            'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_spent(self, obj):
        qs = Transaction.objects.filter(
            user=obj.user,
            transaction_type='Expense',
            transaction_date__gte=obj.start_date,
            transaction_date__lte=obj.end_date
        )
        if obj.category:
            qs = qs.filter(category=obj.category)
        val = qs.aggregate(total=Sum('amount'))['total'] or 0
        return float(val)

    def get_remaining(self, obj):
        spent = self.get_spent(obj)
        return max(0, float(obj.amount) - spent)

    def get_usage_percent(self, obj):
        spent = self.get_spent(obj)
        amt = float(obj.amount)
        if amt > 0:
            return round((spent / amt) * 100, 1)
        return 0.0

    def get_status(self, obj):
        pct = self.get_usage_percent(obj)
        if pct >= 100:
            return 'Exceeded'
        if pct >= 80:
            return 'Warning'
        return 'Safe'

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget amount must be positive.")
        return value

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and start > end:
            raise serializers.ValidationError({"start_date": "Start date cannot be after end date."})
        return attrs
