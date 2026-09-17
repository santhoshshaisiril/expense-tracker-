from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Category.objects.filter(user=self.request.user)
        cat_type = self.request.query_params.get('type')
        if cat_type in ['Income', 'Expense']:
            qs = qs.filter(category_type=cat_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Check if transactions use this category
        if instance.transactions.exists():
            return Response(
                {'error': 'Conflict', 'message': f'Cannot delete category because it is used by {instance.transactions.count()} transactions.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
