<?php if (isLoggedIn()): ?>
            </main>
            
            <!-- Footer -->
            <footer class="bg-white py-4 px-6 border-t">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        &copy; <?php echo date('Y'); ?> HardwareServ Management System
                    </div>
                    <div class="text-sm text-gray-500">
                        Version 1.0.0
                    </div>
                </div>
            </footer>
        </div>
    </div>
    <?php else: ?>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- JavaScript -->
    <script>
        // Toggle mobile menu
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', function() {
                    mobileMenu.classList.toggle('hidden');
                });
            }
            
            // Close alerts
            const alerts = document.querySelectorAll('[role="alert"]');
            alerts.forEach(alert => {
                setTimeout(() => {
                    alert.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                    setTimeout(() => {
                        alert.remove();
                    }, 500);
                }, 5000);
            });
            
            // Dropdown behavior
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                const button = item.querySelector('button');
                const dropdown = item.querySelector('.dropdown-menu');
                
                if (button && dropdown) {
                    button.addEventListener('click', () => {
                        dropdown.classList.toggle('hidden');
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', (event) => {
                        if (!item.contains(event.target)) {
                            dropdown.classList.add('hidden');
                        }
                    });
                }
            });
            
            // Form validations
            const forms = document.querySelectorAll('form[data-validate="true"]');
            forms.forEach(form => {
                form.addEventListener('submit', function(event) {
                    let isValid = true;
                    
                    // Required fields
                    const requiredFields = form.querySelectorAll('[required]');
                    requiredFields.forEach(field => {
                        if (!field.value.trim()) {
                            isValid = false;
                            field.classList.add('border-red-500');
                            
                            // Add error message if doesn't exist
                            let nextEl = field.nextElementSibling;
                            if (!nextEl || !nextEl.classList.contains('text-red-500')) {
                                const errorMsg = document.createElement('p');
                                errorMsg.classList.add('text-red-500', 'text-xs', 'mt-1');
                                errorMsg.textContent = 'This field is required';
                                field.parentNode.insertBefore(errorMsg, field.nextSibling);
                            }
                        } else {
                            field.classList.remove('border-red-500');
                            
                            // Remove error message if exists
                            let nextEl = field.nextElementSibling;
                            if (nextEl && nextEl.classList.contains('text-red-500')) {
                                nextEl.remove();
                            }
                        }
                    });
                    
                    // Email validation
                    const emailFields = form.querySelectorAll('input[type="email"]');
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    emailFields.forEach(field => {
                        if (field.value.trim() && !emailRegex.test(field.value.trim())) {
                            isValid = false;
                            field.classList.add('border-red-500');
                            
                            // Add error message if doesn't exist
                            let nextEl = field.nextElementSibling;
                            if (!nextEl || !nextEl.classList.contains('text-red-500')) {
                                const errorMsg = document.createElement('p');
                                errorMsg.classList.add('text-red-500', 'text-xs', 'mt-1');
                                errorMsg.textContent = 'Please enter a valid email address';
                                field.parentNode.insertBefore(errorMsg, field.nextSibling);
                            }
                        }
                    });
                    
                    if (!isValid) {
                        event.preventDefault();
                    }
                });
            });
            
            // Initialize any datepickers
            const datepickers = document.querySelectorAll('.datepicker');
            if (datepickers.length > 0) {
                // This would integrate with a datepicker library of your choice
                console.log('Datepickers found but not initialized - implement with your preferred library');
            }
        });
        
        // Animation for page transitions
        window.addEventListener('pageshow', function(event) {
            document.body.classList.add('animate-fadeIn');
        });
    </script>
</body>
</html>