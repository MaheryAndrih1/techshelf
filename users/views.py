from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from .models import BillingInfo
from .forms import RegistrationForm, ProfileEditForm, BillingInfoForm

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # For debugging
        print(f"Attempting login with email: {email}")
        
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            
            # Check for next parameter
            next_url = request.GET.get('next')
            if next_url:
                return redirect(next_url)
            return redirect('landing:home')
        else:
            messages.error(request, 'Invalid email or password.')
            
    return render(request, 'users/login.html')

def logout_view(request):
    logout(request)
    return redirect('landing:home')

def register_view(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('landing:home')
    else:
        form = RegistrationForm()
    return render(request, 'users/register.html', {'form': form})

@login_required
def profile_view(request):
    return render(request, 'users/profile.html')

@login_required
def edit_profile_view(request):
    if request.method == 'POST':
        form = ProfileEditForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated.')
            return redirect('users:profile')
    else:
        form = ProfileEditForm(instance=request.user)
    return render(request, 'users/edit_profile.html', {'form': form})

@login_required
def billing_info_view(request):
    if request.method == 'POST':
        form = BillingInfoForm(request.POST, instance=request.user.billinginfo)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your billing information has been updated.')
            return redirect('users:profile')
    else:
        form = BillingInfoForm(instance=request.user.billinginfo)
    return render(request, 'users/billing.html', {'form': form})

@login_required
def upgrade_to_seller_view(request):
    if request.method == 'POST':
        request.user.upgrade_to_seller()
        messages.success(request, 'Your account has been upgraded to seller.')
        return redirect('users:profile')
    return render(request, 'users/upgrade_seller.html')
