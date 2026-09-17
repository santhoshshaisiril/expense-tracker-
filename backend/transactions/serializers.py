from rest_framework import serializers
from .models import Transaction
from categories.models import Category

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'transaction_type', 'amount', 'category', 'category_name',
            'description', 'payment_method', 'transaction_date', 'notes',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        category = attrs.get('category', getattr(self.instance, 'category', None))
        if category and category.user != user:
            raise serializers.ValidationError({'category': "Selected category does not belong to you."})
        return attrs
