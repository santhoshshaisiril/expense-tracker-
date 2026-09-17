from rest_framework import viewsets, permissions, filters
from django.db.models import Q
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.filter(user=user)

        # Filters
        tx_type = self.request.query_params.get('type')
        if tx_type in ['Income', 'Expense']:
            qs = qs.filter(transaction_type=tx_type)

        category_id = self.request.query_params.get('category_id')
        if category_id:
            qs = qs.filter(category_id=category_id)

        payment_method = self.request.query_params.get('payment_method')
        if payment_method and payment_method != 'All':
            qs = qs.filter(payment_method=payment_method)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(transaction_date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(transaction_date__lte=end_date)

        min_amount = self.request.query_params.get('min_amount')
        if min_amount:
            qs = qs.filter(amount__gte=min_amount)

        max_amount = self.request.query_params.get('max_amount')
        if max_amount:
            qs = qs.filter(amount__lte=max_amount)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(notes__icontains=search) |
                Q(category__name__icontains=search) |
                Q(payment_method__icontains=search)
            )

        sort_by = self.request.query_params.get('sort_by', 'transaction_date')
        sort_order = self.request.query_params.get('sort_order', 'DESC')
        prefix = '' if sort_order.upper() == 'ASC' else '-'
        allowed_sorts = {'transaction_date': 'transaction_date', 'amount': 'amount', 'created_at': 'created_at'}
        field = allowed_sorts.get(sort_by, 'transaction_date')

        return qs.order_by(f"{prefix}{field}", '-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
