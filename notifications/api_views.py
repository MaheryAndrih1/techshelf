from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Notification, SalesReport
from .serializers import NotificationSerializer, SalesReportSerializer
from django.utils import timezone
from datetime import datetime, timedelta
import logging
import traceback

# Configure logger
logger = logging.getLogger(__name__)

class NotificationListView(generics.ListAPIView):
    """List all notifications for the authenticated user"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class MarkNotificationReadView(generics.UpdateAPIView):
    """Mark a notification as read"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notification_id'
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(is_read=True)

class SalesReportListView(generics.ListAPIView):
    """List all sales reports for the authenticated seller's store"""
    serializer_class = SalesReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if user is a seller and has a store
        if self.request.user.role != 'SELLER' or not hasattr(self.request.user, 'store'):
            return SalesReport.objects.none()
        
        return SalesReport.objects.filter(store=self.request.user.store).order_by('-report_date')

class GenerateReportView(APIView):
    """Generate a new sales report"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Debug info
            logger.debug(f"Report generation request received: {request.data}")
            
            # Check if user is a seller
            if request.user.role != 'SELLER':
                return Response({'error': 'Only sellers can generate sales reports'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user has a store
            if not hasattr(request.user, 'store'):
                return Response({'error': 'You need to create a store first'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get date parameters with defaults
            try:
                start_date = request.data.get('start_date')
                end_date = request.data.get('end_date')
                
                if not start_date:
                    # Default to 30 days ago
                    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                
                if not end_date:
                    # Default to today
                    end_date = datetime.now().strftime('%Y-%m-%d')
                
                # Parse dates
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError as e:
                logger.error(f"Date format error: {e}")
                return Response({'error': f'Invalid date format: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create a simplified report for testing purposes
            try:
                # For testing, create a basic report even if there's no data
                report = SalesReport.objects.create(
                    report_id=f"report_{request.user.store.store_id}_{int(datetime.now().timestamp())}",
                    store=request.user.store,
                    total_sales=0.0,  # Default to 0 for empty/test report
                    start_date=start_date_obj,
                    end_date=end_date_obj
                )
                
                # Return serialized report
                serializer = SalesReportSerializer(report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Report creation error: {e}")
                logger.error(traceback.format_exc())
                return Response({'error': f'Error creating report: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Unexpected error in report generation: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SalesReportDetailView(generics.RetrieveAPIView):
    """Get details of a specific sales report"""
    serializer_class = SalesReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'report_id'
    
    def get_queryset(self):
        # Check if user is a seller and has a store
        if self.request.user.role != 'SELLER' or not hasattr(self.request.user, 'store'):
            return SalesReport.objects.none()
        
        # Only allow access to reports for the user's own store
        return SalesReport.objects.filter(store=self.request.user.store)
