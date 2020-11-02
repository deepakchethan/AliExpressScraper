document.addEventListener('DOMContentLoaded', function() {
    function updateState() {
        chrome.storage.local.get(null, function(items) {
            var urls = '';

            for (const [key, value] of Object.entries(items)) {
                urls = urls + '<p>'+ key +'</p>'
            }
            document.getElementById('scrapedUrls').innerHTML = urls;
            console.log(Object.values(items))
        });
    }
    updateState();

    // listen for download button clicks
    var downloadbtn = document.getElementById('download');
    downloadbtn.addEventListener('click', function() {
        chrome.storage.local.get(null, function (items) {
            var text = 'URL, TITLE, PRICE, STORE, IMAGES, COLORS, SIZES, SPECS, DELIVERY METHODS \n';

            for (const [key, value] of Object.entries(items)) {
                text = text + '\"' + key + '\",' + value +'\n';
            }

            var element = document.createElement('a');

            element.setAttribute('href', 'data:text/csv;charset=UTF-8-BOM,' + encodeURIComponent(text));
            element.setAttribute('download', 'alibaba-data.csv');

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);

            chrome.storage.local.clear();

            updateState();
        });
    });

    // Listen for scraping
    var checkPageButton = document.getElementById('scrapeNow');
    checkPageButton.addEventListener('click', function() {
        async function scrapeDom() {
            if (window.location.href.indexOf('aliexpress.com') === -1) {
                window.alert("This is not aliexpress.com!");
            }
            var i;
            var sizes = [];
            var colors = [];
            var images = [];
            var scrapedData = [];
            // title
            scrapedData.push(document.getElementsByClassName('product-title-text')[0].innerText);

            // price
            scrapedData.push(document.getElementsByClassName('product-price-value')[0].innerText);

            // store name
            scrapedData.push(document.getElementsByClassName('store-name')[0].innerText);

            // images
            var imagesDom = document.getElementsByClassName('images-view-item');
            for (i = 0; i < imagesDom.length; i++) {
                images.push(imagesDom[i].firstElementChild.src.replace('jpg_50x50','jpg_Q90'));
            }
            scrapedData.push(images.join(','));

            // colors with links
            var colorsDom = document.getElementsByClassName('sku-property-image');
            for (i = 0; i < colorsDom.length; i++) {
                colors.push(colorsDom[i].firstElementChild.title + ":" + colorsDom[i].firstElementChild.src);
            }
            scrapedData.push(colors.join(','));

            // sizes
            var sizesDom = document.getElementsByClassName('sku-property-text');
            for (i = 0; i < sizesDom.length; i++) {
                sizes.push(sizesDom[i].innerText);
            }
            scrapedData.push(sizes.join(','));

            // specs
            window.scrollBy(0, 1200);
            document.querySelectorAll('[ae_button_type="tab_specs"]')[0].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            var specs = document.getElementsByClassName('product-specs-list')[0].innerText.replaceAll('\n', ',').replace(/[^a-zA-Z,:]/g, "");
            scrapedData.push(specs);

            // delivery data
            const shippingContainer = document.getElementsByClassName('product-shipping-info')[0];
            if (shippingContainer !== undefined) {
                shippingContainer.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                var loadingWrap = document.getElementsByClassName('next-loading-wrap')[0]
                if (loadingWrap !== undefined) {
                    scrapedData.push(loadingWrap.innerText.replace('	Estimated Delivery	Cost	Tracking	Carrier','')
                        .replaceAll('\n',' ').replaceAll('\t',' '));
                }
            }

            var value = JSON.stringify(scrapedData).replace('[', '').replace(']', '');
            chrome.storage.local.set({[window.location] : value});
            window.alert("Scraping success!");
        }

        //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
        chrome.tabs.executeScript({
            code: '(' + scrapeDom + ')();' //argument here is a string but function.toString() returns function's code
        });
    }, false);
}, false);
