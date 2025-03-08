from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import User, BillingInfo

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('landing:home')
        else:
            messages.error(request, 'Invalid email or password.')
    return render(request, 'users/login.html')

def logout_view(request):
    logout(request)
    return redirect('landing:home')

def register_view(request):
    if request.method == 'POST':
        # Process registration form
        pass
    return render(request, 'users/register.html')

@login_required
def profile_view(request):
    return render(request, 'users/profile.html')

@login_required
def edit_profile_view(request):
    if request.method == 'POST':
        # Process profile edit form
        pass
    return render(request, 'users/edit_profile.html')

@login_required
def billing_info_view(request):
    if request.method == 'POST':
        # Process billing info form
        pass
    return render(request, 'users/billing.html')

@login_required
def upgrade_to_seller_view(request):
    if request.method == 'POST':
        request.user.upgrade_to_seller()
        messages.success(request, 'Your account has been upgraded to seller.')
        return redirect('users:profile')
    return render(request, 'users/upgrade_seller.html')
