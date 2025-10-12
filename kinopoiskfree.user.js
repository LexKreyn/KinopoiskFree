// ==UserScript==
// @name           KinopoiskFree
// @name:ru        Бесплатный Кинопоиск
// @namespace      http://tampermonkey.net/
// @version        1.12
// @description    Add modal with links for free watch
// @description:ru Добавляет окно с ссылками для бесплатного просмотра
// @author         Lex
// @copyright      2024, Lex
// @icon           https://www.kinopoisk.ru/favicon.ico
// @icon64         https://www.kinopoisk.ru/favicon.ico
// @homepage       https://www.kinopoisk.ru/
// @match          https://*.kinopoisk.ru/*
// @grant          none
// @run-at         document-end
// @license        MIT
// @updateURL      https://raw.githubusercontent.com/LexKreyn/KinopoiskFree/main/kinopoiskfree.meta.js
// @downloadURL    https://raw.githubusercontent.com/LexKreyn/KinopoiskFree/main/kinopoiskfree.user.js
// @homepageURL    https://github.com/LexKreyn/KinopoiskFree#readme
// @supportURL     https://github.com/LexKreyn/KinopoiskFree/issues
// ==/UserScript==

(function() {
    'use strict';

    const freeHosts = {
        'db.lol': 'https://ddbb.lol/?id={filmId}&n=0',
        'C_X': 'https://ww2.kpfr.online/film/{filmId}/',
        'FlicksBar': 'https://flcksbr.top/film/{filmId}/',
        'ReYohoho': 'https://reyohoho.github.io/reyohoho/movie/{filmId}'
    };

    function format(str, params) {
        return str.replace(/{(\w+)}/g, (match, key) => params[key] || match);
    }

    function on_page()
    {
        if (!/(film\/|series\/)\d+/.test(window.location.pathname)) {
            return;
        }

        const playIcon = '<img loading="lazy" class="styles_icon__PXEHs" src="https://kinopoisk-ru.clstorage.net/1L67Lp105/8104496rxAA/4nq7_c7JTSEWrXfL5Fxhy9WB5nNJyH8TcCAGrwXWmGkA0cV31X2Yqd4WH1BCTMIO_NGvKAB-XoYv_57nOP6AhDL5KXuPmUwxQj-yDLMJs04SgTFkCF2vVHMk2qEM28OmTl7N_1ulyzpO0ckG0hlTWyjVOToF7gRdf7oBbPomkwyjoWytBE8GZlYle17i1GVVmAyov0zAKJk55BjoRN7IbMTQzbiTpcz-D8gDB9_S3VAjWTCiB-dCUmK-SCU0J1bPq25jKkPOjyUX77fbbVYhFddJ7jMOiuqdvK6fp0Ibw2BHGEE1FKtKdY1IT4Uc2lQYINSzYc1oApCiewgieeqcjiZiIqVOTQGuFeMwnK0ZIJOfxOC3RUXlG3Qs3-PJmo7qSNwCMBtown8OBgMIUxhbHOEf8OrAI4DaYboLYzWoVMXrqqPlSwiGoZIksNqpkC1dH4hkvorGLdT4aZwgxFcLbA3bxbxYaAV1z8eGiFzTk9golfloSuJHWiG6h6nx5xzApW2rL4QOSeEcILhZa5-oXdaAaPkLAmQRdGhcpQcQgWjLngoznetNuwvLzcGa09-b4Z0yZUWpgVQjfIaheaCZxaQhLibPT0Et1mFyUiLd7hCVzGi2ygOnkHMhlqVHXQZvAVCOctWnS3yOAoZNmJsVm2ERMWCLLUGXp3NIojHm14Qu7uuijMEDL5SluRitH68e2Iju9AHN6dp4rBQvwdFKL8XWgrVa64M2yoBIRZBRlNEp0LKlT2LDGi01RC2441-PIu7oq4rIxiDeLTcd5dTglFOH7PZMSOmdsOdV6smYwanDmss9VW4Ls0bJSEkamJuc59R25IdtR9-s9U_sNCKdyaoirqrFzAnl1Gg63WpTIZNaw-d2wo6pWnppXCBBGkBnz1AH9BNlhPKCB8cOk1eXmetb_yrHZQaUIb7IavrpmAYsom1oBQWE7Jcl81iikGaWFoTufs0GIdH_I5BtChkBJMaQwvMb60C0QMDKgZMaVJQvHf3nAKKAFCr4By-865ZHJ2ftpYsIgO-TaDORaZFhlFaIqH-Cz-3cfWWYrc-bQWMGkIV1Ua4P-wjPAQnQkJSeppy4bImmBx-sckNhc-JXxm9ioy5Njg6s0iq9FKecodjeiCkwAUpt2zTt3eePXomrCBeFvJkjRTXKjk-NXR9ZEKraO63B7sAXLvJCq_xnnIWnLiQlRIpJ5Z9rcl5v0S8ZmMju-ohA5Fs7LtyugR5FLwRbjvKdas0_C4COBlrZUhShkTtqBGqF0C04Tu36JJCH7ujtL4SMTmff63CQ51zjlhXEJjvGCmRTNSsRrY3fS2UBGQk-VexKtoOICUwU21SdbNt_7MplQhbsfIDtPWeZiGdqZeyIAo6u02-3Ui5Xqxgbg6c7iQ6pGDijVaDBm0JtCRgM_hpoQ3uJyMLFkFNWUW7femtNqckfq3JHJvShXoEnqGPjBEXBZpzitpKv3C9dV8TuP0bHIB2x59WvDd5OIUMRhvxa7A87gkNAQdXRUd1h1_2gRaDD2GM8C-v2qdbNZOVlbkvOD2HVJPmcLZlh01DNpXvNBGXbuuFRJM0QhuFE0cP1VWXCfQ7PAYCZEZ_drp-_pMAhSpovdYhss6rWTWgibqCOyA6gG-w4kmRY51mew2-wBoJpHDDuFK3FUsvqR1FM-N3txLPFgwLC0F5SnqEcdqkPZsDRrz9GbvLh00DooeOkCglD6J_ksVYuViQTEcTgMQhCItX1advjBNbKoMnUTbbT5cK5CUtBTlfZnhJnkL-nj-iO2iN1gK2yqRQApS1qZY0Jzupd7_vbbVPuW9pLJPLET69VMS3RLYlaR6oDEQo_0SLDdM_AyI9YG9sSbBl2pMvuDhzm_EeieyKczaooIy5OyoXqmOG21m_RoNKQgOt4xsunlnijXqrJkgErSFcCeJpvA3bCT04M2JBVW2GVuuQI4ELabTAO7H0nXEfnJ-2ogsVEZdssdRmq1a-e10Jn-8bDJZ2x7BxlTV8P5cwcBXra5YL3SIKLCFwQ3VLmUPmtymLK16R3CqO5oxRF7mZoq4cHhyKc5XdSp9tuUx9Kb_-LD2naNylf5QFfgGyD0crz0K2Od0GJywBQk5oVaNvypU0gxpjms4mnNiAQQW9prOtCxcsl0m13WKeeptAewqO4QovnmzmvGCXB1gpvg9hM8BTnR3GJBAXGmt4fkmTZd23BIkvXJzAJqrhiUcdjbq6iBsdPLF1t9xAv16CTFwJoscjLbhh5Id8iCVnJIQ9eQjTU5Eu9wINIjtgRnxKmWToqwS6OVumzAGXx4lMEKCBiI4WERCnQYzLcbdtt3R3PL_PDByBZ-C7fJ8UWDqPPF42y3WjNs4IBjYZUVNbZolN3YornwZpid0Ps-aaYSmynJeOIgQelW6k7lmbWI1iXRGbwTAdtEjjsHevHmgWjTRIK91zsRjtFB4AB0teRVW_RMaWMokgR5_oBZv1hmI3s7K4miAQMJJhj-FTrmafT2YRmOMTFYRL8LpEqj9bC7InYhvIT58e2hkAGRBVbllSp2DOqg-9LGiU4SewyYtbOoKUhq0DHRejY6_cZaparnt8IqPwAy6_TPCNfL4AQwOyF1EL-VGPGvk7JywdTHJea79B54IIuBZlhMsBq_igfACom7WNCToBgWiV3HGGUoF2dz6C5Qcrh3LcvH-3HUYtpSZLLv9QiA_6KgMeHVFkRHKLdOWIKYsZfpv8M6nVoEMXjKGqnT86GbtChsJ4iUeWcVs8muIgMoJm451kljttFIM6TwbKYoAu-B4EIgRHa1BXr23FiDSAD1-x8C6R26lGC7WxkZA3Jj29TJTocoVan1NfN6PmODqhT8SMZ7IzXhiAOF011kWRDfwGJQ0EbX96TLNd-ak9gDRiqtcth-WOYgC8vrqcHDwRqlSex3eSX6FRSg2Q5S0YpGvwsmetH2g7iztcK_hOtirrOBAFOE9MSWGYQcGFFpw9cJA">';
        const style = document.createElement('style');
        style.textContent = `
            .floating-links-modal {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999999;
                font-family: var(--font-family,"Graphik Kinopoisk LC Web",Tahoma,Arial,Verdana,sans-serif);
                font-size: 15px;
                font-weight: var(--font-weight-medium,500);
                font-style: normal;
                line-height: 18px;
                background: #141414;
                border-radius: 16px;
                padding: 5px;
                width: 200px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                animation: fadeIn 0.3s ease-out;
                transition: color .2s ease;
            }

            .floating-links-modal ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .floating-links-modal li {
                margin: 8px 0;
            }

            .floating-links-modal a {
                color: #a1a1a1;
                text-decoration: none;
                transition: color 0.2s ease;
                display: flex;
                align-items: center;
                padding: 5px;
                border-radius: 5px;
            }

            .floating-links-modal a:hover {
                color: #ffffff;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);

        setInterval(function() {
            var filmId = window.location.pathname.split('/')[2];
            var work = document.getElementById('floating-links-modal');

            if (work === null || work.getAttribute('filmId') != filmId) {
                const modal = document.createElement('div');
                modal.className = 'floating-links-modal';
                modal.setAttribute('filmId', filmId);
                modal.id = 'floating-links-modal';

                const linksList = document.createElement('ul');

                for (const [name, url] of Object.entries(freeHosts)) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = format(url, {filmId: filmId});
                    a.target = "_blank";
                    a.classList.add('styles_root__7mPJN');
                    a.classList.add('styles_darkThemeItem__E_aGY');
                    a.innerHTML = playIcon + name;
                    li.appendChild(a);
                    linksList.appendChild(li);
                }

                modal.appendChild(linksList);
                if (work !== null) { work.remove(); }
                document.body.appendChild(modal);
            }
        }, 100);
    }

    on_page();
})();

