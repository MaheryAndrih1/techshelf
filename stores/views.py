from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Store, StoreTheme, Rating

def landing_page_view(request):
    featured_stores = Store.objects.all()[:6]
    return render(request, 'landing/home.html', {'featured_stores': featured_stores})

def about_view(request):
    return render(request, 'landing/about.html')

def contact_view(request):
    return render(request, 'landing/contact.html')

def how_it_works_view(request):
    return render(request, 'landing/how_it_works.html')

def store_list_view(request):
    stores = Store.objects.all()
    return render(request, 'stores/list.html', {'stores': stores})

@login_required
def create_store_view(request):
    if request.user.role != 'SELLER':
        messages.error(request, 'You need to be a seller to create a store.')
        return redirect('users:upgrade_seller')
    
    if request.method == 'POST':
        # Process store creation form
        pass
    return render(request, 'stores/create.html')

def store_detail_view(request, subdomain):
    store = get_object_or_404(Store, subdomain_name=subdomain)
    products = store.products.all()
    return render(request, 'stores/detail.html', {'store': store, 'products': products})

@login_required
def edit_store_view(request, subdomain):
    store = get_object_or_404(Store, subdomain_name=subdomain)
    
    if request.user != store.user:
        messages.error(request, 'You do not have permission to edit this store.')
        return redirect('stores:detail', subdomain=subdomain)
    
    if request.method == 'POST':
        # Process store edit form
        pass
    return render(request, 'stores/edit.html', {'store': store})

@login_required
def store_theme_view(request, subdomain):
    store = get_object_or_404(Store, subdomain_name=subdomain)
    
    if request.user != store.user:
        messages.error(request, 'You do not have permission to edit this store theme.')
        return redirect('stores:detail', subdomain=subdomain)
    
    if request.method == 'POST':
        # Process theme edit form
        pass
    return render(request, 'stores/theme.html', {'store': store})

def store_ratings_view(request, subdomain):
    store = get_object_or_404(Store, subdomain_name=subdomain)
    ratings = store.ratings.all().order_by('-timestamp')
    return render(request, 'stores/ratings.html', {'store': store, 'ratings': ratings})

@login_required
def rate_store_view(request, subdomain):
    store = get_object_or_404(Store, subdomain_name=subdomain)
    
    if request.method == 'POST':
        # Process rating form
        pass
    return render(request, 'stores/rate.html', {'store': store})
