from rest_framework import viewsets, permissions
from .models import Budget
from .serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by('category_id__isnull', '-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
