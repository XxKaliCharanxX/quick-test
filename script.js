document.addEventListener("DOMContentLoaded", function() {

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for fade-in animations
    const featureCards = document.querySelectorAll('.feature-card');

    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a staggered delay for a nicer effect
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 150); 
                observer.unobserve(entry.target); // Stop observing after it's visible
            }
        });
    }, observerOptions);

    featureCards.forEach(card => {
        observer.observe(card);
    });

});