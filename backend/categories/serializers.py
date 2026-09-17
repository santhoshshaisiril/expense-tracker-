from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'user', 'name', 'category_type', 'description', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def validate(self, attrs):
        user = self.context['request'].user
        name = attrs.get('name', getattr(self.instance, 'name', None))
        category_type = attrs.get('category_type', getattr(self.instance, 'category_type', None))

        qs = Category.objects.filter(user=user, name__iexact=name, category_type=category_type)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(f"Category '{name}' already exists for {category_type}.")
        return attrs
