function handlePriceContainer(currency, conversionRate) {
    const priceContainers = document.querySelectorAll('.price-title');
    priceContainers.forEach(container => {
        const spans = container.querySelectorAll('span');
        spans.forEach(span => {
            if (span.innerText.includes('CNY')) {
                const price = parseFloat(span.innerText.match(/\d+\.\d+/)[0]);
                const convertedPrice = (price * conversionRate).toFixed(2);
                span.innerText = `CYN ${price} (${currency} ${convertedPrice})`;
            }
        });
    });
}

function checkForPriceContainer(currency, conversionRate) {
    const priceContainer = document.querySelector('.price-title');
    if (priceContainer) {
        handlePriceContainer(currency, conversionRate);
    } else {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    if (mutation.target.querySelector('.price-title')) {
                        observer.disconnect();
                        handlePriceContainer(currency, conversionRate);
                        return;
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

function fetchConversionRate(currency) {
    return fetch('https://www.floatrates.com/daily/cny.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const conversionRate = data[currency.toLowerCase()]?.rate;
            if (!conversionRate) {
                throw new Error('Conversion rate not found for the specified currency');
            }
            return conversionRate;
        });
}

chrome.storage.sync.get(['currency', 'conversionRate', 'lastUpdated'], ({ currency, conversionRate, lastUpdated }) => {
    if (currency && conversionRate && lastUpdated && Date.now() - lastUpdated < 24 * 60 * 60 * 1000) {
        checkForPriceContainer(currency, conversionRate);
    } else {
        fetchConversionRate(currency)
            .then(conversionRate => {
                chrome.storage.sync.set({ conversionRate });
                chrome.storage.sync.set({ lastUpdated: Date.now() });
                checkForPriceContainer(currency, conversionRate);
            })
            .catch(error => {
                console.error('Error fetching conversion rate:', error);
            });
    }
});
