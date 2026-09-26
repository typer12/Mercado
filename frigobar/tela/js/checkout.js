const API_BASE = (() => {
    const path = window.location.pathname;

    if (path.includes('/tela/')) {
        return '../../api/pix/index.php';
    }

    return '../api/pix/index.php';
})();

const Navigation = {
    goBack: () => {
        const referrer = document.referrer;
        const current = window.location.href;
        
        // Verificar se há histórico ou veio de outra página do domínio
        if (history.length > 1 && referrer && referrer.includes(window.location.origin)) {
            history.back();
        } else {
            // Redirecionar para página padrão baseada na página atual
            const path = window.location.pathname;
            
            if (path.includes('pagamento.html')) {
                // Verificar se veio de upsells
                const hasUpsells = storage.get('upsell_data');
                if (hasUpsells && Object.keys(hasUpsells.items).length > 0) {
                    window.location.href = 'upsells.html' + window.location.search;
                } else {
                    window.location.href = 'frete.html' + window.location.search;
                }
            } else if (path.includes('frete.html')) {
                window.location.href = 'endereco.html' + window.location.search;
            } else if (path.includes('upsells.html')) {
                window.location.href = 'frete.html' + window.location.search;
            } else if (path.includes('endereco.html')) {
                window.location.href = 'index.html';
            } else {
                // Fallback para página inicial
                window.location.href = 'index.html';
            }
        }
    }
};

const Security = {
    sanitize: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"'/]/g, (match) => {
            const escape = {
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
            };
            return escape[match];
        }).trim();
    },

    validateCPF: (cpf) => {
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;

        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        return rev === parseInt(cpf.charAt(10));
    }
};

const Toast = {
    container: null,
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    show(message, type = 'default') {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '{}'),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    update: (key, val) => {
        const current = storage.get(key);
        Object.keys(val).forEach(k => {
            if (typeof val[k] === 'string') {
                val[k] = Security.sanitize(val[k]);
            }
        });
        storage.set(key, { ...current, ...val });
    }
};

const UI = {
    showError: (el, message) => {
        el.style.borderColor = '#ff0000';
        let err = el.parentNode.querySelector('.error-msg');
        if (!err) {
            err = document.createElement('span');
            err.className = 'error-msg';
            err.style.color = '#ff0000';
            err.style.fontSize = '12px';
            err.style.marginTop = '4px';
            err.style.display = 'block';
            el.parentNode.appendChild(err);
        }
        err.textContent = message;
    },
    clearError: (el) => {
        el.style.borderColor = '#ccc';
        const err = el.parentNode.querySelector('.error-msg');
        if (err) err.remove();
    },
    loading: (el, isLoading) => {
        if (isLoading) {
            el.disabled = true;
            el.dataset.originalText = el.textContent;
            el.textContent = 'Carregando...';
        } else {
            el.disabled = false;
            el.textContent = el.dataset.originalText || el.textContent;
        }
    }
};

const masks = {
    cpf: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    },
    phone: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },
    cep: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        return v.replace(/(\d{5})(\d)/, '$1-$2');
    },
    date: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        return v.replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2');
    }
};

const Masks = {
    apply: (el, maskName) => {
        if (!el) return;
        el.addEventListener('input', (e) => {
            const v = e.target.value;
            e.target.value = masks[maskName](v);
        });
    }
};

function initBackButtons() {
    document.addEventListener('click', (e) => {
        const backBtn = e.target.closest('[data-back="true"]');
        if (backBtn) {
            e.preventDefault();
            Navigation.goBack();
        }
    });
}

function initAddress() {
    const inputs = document.querySelectorAll('.form-input, .ml-input, .ml-select');

    const telInput = document.getElementById('telefone');
    if (telInput) Masks.apply(telInput, 'phone');

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        Masks.apply(cepInput, 'cep');

        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    cepInput.style.opacity = '0.7';
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await res.json();

                    if (!data.erro) {
                        const setVal = (id, val) => {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        };
                        setVal('logradouro', data.logradouro);
                        setVal('bairro', data.bairro);
                        setVal('cidade', data.localidade);
                        setVal('estado', data.uf);

                        const numInput = document.getElementById('numero');
                        if (numInput) numInput.focus();
                        UI.clearError(cepInput);
                    } else {
                        Toast.show('CEP não encontrado.', 'error');
                        UI.showError(cepInput, 'CEP não encontrado.');
                    }
                } catch (e) {
                    console.error(e);
                    Toast.show('Erro ao buscar CEP.', 'error');
                } finally {
                    cepInput.style.opacity = '1';
                }
            }
        });
    }

    const saved = storage.get('checkout_data');
    inputs.forEach(el => {
        if (saved[el.id]) el.value = saved[el.id];
    });

    const form = document.getElementById('form-address');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;

            if (telInput && telInput.value.length < 14) {
                UI.showError(telInput, 'Telefone inválido');
                valid = false;
            } else if (telInput) UI.clearError(telInput);

            if (cepInput && cepInput.value.length < 9) {
                UI.showError(cepInput, 'CEP incompleto');
                valid = false;
            } else if (cepInput) UI.clearError(cepInput);

            if (!valid) {
                Toast.show('Verifique os campos obrigatórios.', 'error');
                return;
            }

            const data = {};
            inputs.forEach(el => data[el.id] = el.value);
            storage.update('checkout_data', data);
            console.log("Redirecting to Shipping with params:", window.location.search);
            window.location.href = 'frete.html' + window.location.search;
        });
    }
}

async function initPayment() {
    const addressData = storage.get('checkout_data');
    if (!addressData.cep) {
        window.location.href = 'endereco.html' + window.location.search;
        return;
    }

    const populateReview = () => {
        const addr = addressData;
        const recipient = document.getElementById('review-recipient');
        const addressLine = document.getElementById('review-address');
        const cityCep = document.getElementById('review-city-cep');

        if (recipient && addr.destinatario && addr.telefone) {
            recipient.textContent = `${addr.destinatario} - ${masks.phone(addr.telefone)}`;
        }

        if (addressLine && addr.logradouro && addr.numero) {
            addressLine.textContent = `${addr.logradouro}, ${addr.numero}`;
        }

        if (cityCep && addr.cidade && addr.estado && addr.cep) {
            cityCep.textContent = `${addr.cidade}, ${addr.estado} - CEP ${masks.cep(addr.cep)}`;
        }

        const shipEl = document.getElementById('shipping-date');
        const shippingTitle = document.querySelector('.shipping-title');
        if (shipEl) {
            const savedShipping = storage.get('shipping_data');

            if (savedShipping && savedShipping.daysMin !== undefined) {
                if (savedShipping.daysMin <= 1 && savedShipping.daysMax <= 2) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
                    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                    shipEl.textContent = `Chega amanhã, ${tomorrow.getDate()} de ${months[tomorrow.getMonth()]}`;
                    if (shippingTitle) shippingTitle.textContent = savedShipping.company || 'Envio Rápido';
                } else {
                    shipEl.textContent = `Chega em até ${savedShipping.daysMax} dias úteis`;
                    if (shippingTitle) shippingTitle.textContent = savedShipping.company || 'Envio Padrão';
                }
            } else {
                const defaultDays = (typeof SiteConfig !== 'undefined' && SiteConfig.product) ? SiteConfig.product.daysToDelivery : 7;
                shipEl.textContent = `Chega em até ${defaultDays} dias úteis`;
            }
        }

        if (addr.destinatario) {
            const parts = addr.destinatario.trim().split(' ');
            const nEl = document.getElementById('nome');
            const sEl = document.getElementById('sobrenome');
            if (nEl && !nEl.value) nEl.value = parts[0] || '';
            if (sEl && !sEl.value) sEl.value = parts.slice(1).join(' ') || '';
        }
    };
    populateReview();

    const cpfEl = document.getElementById('cpf');
    if (cpfEl) Masks.apply(cpfEl, 'cpf');

    const birthEl = document.getElementById('nascimento');
    if (birthEl) Masks.apply(birthEl, 'date');

    const pixBtn = document.getElementById('btn-create-pix');
    if (pixBtn) {
        pixBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('nome');
            const surnameInput = document.getElementById('sobrenome');
            const emailInput = document.getElementById('email');

            let valid = true;

            const rawCPF = cpfEl.value.replace(/\D/g, '');
            if (!Security.validateCPF(rawCPF)) {
                UI.showError(cpfEl, 'CPF inválido');
                valid = false;
            } else {
                UI.clearError(cpfEl);
            }

            const rawDate = birthEl.value.replace(/\D/g, '');
            const day = parseInt(rawDate.substr(0, 2));
            const month = parseInt(rawDate.substr(2, 2));
            const year = parseInt(rawDate.substr(4, 4));

            if (rawDate.length !== 8 || day > 31 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
                UI.showError(birthEl, 'Data inválida');
                valid = false;
            } else {
                UI.clearError(birthEl);
            }

            if (Security.sanitize(nameInput.value).trim().length < 2) {
                UI.showError(nameInput, 'Nome obrigatório');
                valid = false;
            } else {
                UI.clearError(nameInput);
            }

            if (Security.sanitize(surnameInput.value).trim().length < 2) {
                UI.showError(surnameInput, 'Sobrenome obrigatório');
                valid = false;
            } else {
                UI.clearError(surnameInput);
            }

            const emailVal = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailVal || !emailRegex.test(emailVal)) {
                UI.showError(emailInput, 'Email inválido');
                valid = false;
            } else {
                UI.clearError(emailInput);
            }

            if (!valid) {
                Toast.show('Verifique os campos em vermelho.', 'error');
                return;
            }

            UI.loading(pixBtn, true);

            const fullName = `${Security.sanitize(nameInput.value)} ${Security.sanitize(surnameInput.value)}`;
            const cleanCPF = cpfEl.value.replace(/\D/g, '');

            const getCartCookie = (name) => {
                let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                if (match) return decodeURIComponent(match[2]);
                return null;
            };

            const cartTotal = localStorage.getItem('valor_total_carrinho') || getCartCookie('valor_total_carrinho');
            let productPrice = 199.90;

            if (cartTotal && parseFloat(cartTotal) > 0) {
                productPrice = parseFloat(cartTotal);
            } else if (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.priceCurrent) {
                productPrice = parseFloat(SiteConfig.product.priceCurrent);
            }

            const payload = {
                value: productPrice,
                name: fullName,
                document: cleanCPF,
                email: emailInput.value.trim(),
                phone: addressData.telefone,
                tracking: {
                    src: new URLSearchParams(window.location.search).get('src'),
                    sck: new URLSearchParams(window.location.search).get('sck'),
                    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
                    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
                    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
                    utm_content: new URLSearchParams(window.location.search).get('utm_content'),
                    utm_term: new URLSearchParams(window.location.search).get('utm_term')
                }
            };

            try {
                document.getElementById('step-nfe').classList.add('hidden');
                document.getElementById('step-loading').classList.remove('hidden');

                console.log('Sending PIX request with payload:', payload);

                const res = await fetch(`${API_BASE}?action=create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Api-Key': 'b7f8e3d2a1c9b4d6e8f0a2c5b7d9e1f3a4c6b8d0e2f5a7c9b1d3e5f7a9c1b3d5'
                    },
                    body: JSON.stringify(payload)
                });

                console.log('Response status:', res.status);

                if (!res.ok) {
                    let errorText = '';
                    try {
                        errorText = await res.text();
                    } catch (e) {
                        errorText = 'Não foi possível ler a resposta';
                    }
                    console.error('Server error:', res.status, errorText);

                    if (res.status === 403) {
                        throw new Error('Acesso negado (403). Verifique as permissões do servidor.');
                    } else if (res.status === 404) {
                        throw new Error('API não encontrada (404). Verifique o caminho da API.');
                    } else {
                        throw new Error(`Erro no servidor: ${res.status}`);
                    }
                }

                const result = await res.json();
                console.log('API result:', result);

                if (result.success && (result.pix_code || result.qr_code_base64)) {
                    renderPixScreen(result);
                    Toast.show('Pix gerado com sucesso!', 'success');
                } else {
                    throw new Error(result.error || 'Falha na comunicação');
                }

            } catch (err) {
                console.error('PIX Error:', err);
                Toast.show(err.message || 'Falha ao gerar Pix.', 'error');
                document.getElementById('step-loading').classList.add('hidden');
                document.getElementById('step-nfe').classList.remove('hidden');
                UI.loading(pixBtn, false);
            }
        });
    }
}

function renderPixScreen(data) {
    document.getElementById('step-loading').classList.add('hidden');
    document.getElementById('step-pix').classList.remove('hidden');

    const copyCode = data.pix_code || "indisponivel";
    const qrImage = data.qr_code_base64 || 'https://via.placeholder.com/200?text=QR+Code+Erro';

    document.getElementById('pix-copypaste-input').textContent = copyCode;
    document.getElementById('pix-qrcode-img').src = qrImage;

    startTimer(600);

    const copyBtn = document.getElementById('btn-copy-pix');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(copyCode);
            const original = copyBtn.innerHTML;
            copyBtn.textContent = "Copiado!";
            Toast.show('Código copiado!', 'success');
            setTimeout(() => copyBtn.innerHTML = original, 2000);
        };
    }

    const confirmBtn = document.getElementById('btn-confirm-pay');
    if (confirmBtn) {
        confirmBtn.onclick = () => checkStatus(data.external_id);
    }

    if (data.external_id) startPolling(data.external_id);
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer-display');
    const interval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        if (display) display.textContent = minutes + ":" + seconds;
        if (--timer < 0) {
            clearInterval(interval);
            if (display) display.textContent = "EXPIRADO";
            Toast.show('O tempo expirou.', 'error');
            setTimeout(() => window.location.reload(), 2000);
        }
    }, 1000);
}

function checkStatus(id) {
    if (!id) return;
    fetch(`${API_BASE}?action=status&external_id=${id}`, {
        headers: {
            'X-Api-Key': 'b7f8e3d2a1c9b4d6e8f0a2c5b7d9e1f3a4c6b8d0e2f5a7c9b1d3e5f7a9c1b3d5'
        }
    })
        .then(async r => {
            if (!r.ok) {
                const txt = await r.text();
                throw new Error(txt || `Erro ${r.status}`);
            }
            return r.json();
        })
        .then(status => {
            if (status.paid && status.redirect_url) {
                Toast.show('Pagamento Aprovado!', 'success');
                setTimeout(() => window.location.href = status.redirect_url, 1500);
            } else {
                Toast.show('Aguardando pagamento...', 'default');
            }
        }).catch(e => {
            console.error('Erro no status:', e);
            Toast.show('Não foi possível verificar o status.', 'error');
        });
}

function startPolling(id) {
    if (!id) return;
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}?action=status&external_id=${id}`, {
                headers: {
                    'X-Api-Key': 'b7f8e3d2a1c9b4d6e8f0a2c5b7d9e1f3a4c6b8d0e2f5a7c9b1d3e5f7a9c1b3d5'
                }
            });
            if (!res.ok) return;

            const status = await res.json();
            if (status.paid && status.redirect_url) {
                clearInterval(interval);
                Toast.show('Pagamento Confirmado!', 'success');
                setTimeout(() => window.location.href = status.redirect_url, 1500);
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }, 15000);
}

function initShipping() {
    const addressData = storage.get('checkout_data');
    if (!addressData.cep) {
        window.location.href = 'endereco.html' + window.location.search;
        return;
    }

    const container = document.getElementById('shipping-options-container');
    const btnContinue = document.getElementById('btn-continue-shipping');

    const productName = document.getElementById('product-name-mini');
    const productPrice = document.getElementById('product-price-mini');
    const productImg = document.getElementById('product-img-mini');

    if (typeof SiteConfig !== 'undefined') {
        if (productName) productName.textContent = SiteConfig.product.name;
        if (productPrice) productPrice.textContent = parseFloat(SiteConfig.product.priceCurrent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (productImg && SiteConfig.product.images) productImg.src = SiteConfig.product.images[0];
    }

    const savedShipping = storage.get('shipping_data');
    let selectedOptionId = savedShipping.id || SiteConfig.shipping.find(s => s.best_option)?.id || SiteConfig.shipping[0].id;

    const renderOptions = () => {
        container.innerHTML = '';
        SiteConfig.shipping.forEach(option => {
            const isSelected = option.id === selectedOptionId;
            const priceText = option.price === 0 ? 'Grátis' : option.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const deliveryLabel = `Chega de ${option.daysMin} a ${option.daysMax} dias úteis`;

            const div = document.createElement('div');
            div.className = `shipping-option ${isSelected ? 'selected' : ''}`;
            div.onclick = () => selectOption(option.id);

            div.innerHTML = `
                <div class="shipping-radio ${isSelected ? 'active' : ''}" style="margin-right: 15px;"></div>
                <img src="${option.logo}" class="shipping-logo">
                <div class="shipping-details">
                    <span class="shipping-company">${option.company}</span>
                    <span class="shipping-info">${deliveryLabel}</span>
                    <span class="shipping-price ${option.price > 0 ? 'paid' : ''}">${priceText}</span>
                </div>
            `;
            container.appendChild(div);
        });
        updateSummary();
    };

    const selectOption = (id) => {
        selectedOptionId = id;
        renderOptions();
    };

    const updateSummary = () => {
        const option = SiteConfig.shipping.find(s => s.id === selectedOptionId);
        const productVal = parseFloat(SiteConfig.product.priceCurrent);
        const shippingVal = option.price;
        const totalVal = productVal + shippingVal;

        document.getElementById('summary-product-price').textContent = productVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('summary-shipping-price').textContent = shippingVal === 0 ? 'Grátis' : shippingVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('summary-total-price').textContent = totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    renderOptions();

    // MODIFICADO: Agora vai para upsells em vez de pagamento direto
    btnContinue.addEventListener('click', () => {
        const option = SiteConfig.shipping.find(s => s.id === selectedOptionId);

        storage.set('shipping_data', option);

        console.log("Redirecionando para upsells...");
        window.location.href = 'upsells.html' + window.location.search;
    });
}

function initUpsells() {
    console.log("Iniciando página de upsells...");
    
    const container = document.getElementById('upsells-container');
    const btnContinue = document.getElementById('btn-continue-payment');
    
    // Carregar upsells selecionados anteriormente
    let selectedUpsells = storage.get('upsell_data') || {};
    if (!selectedUpsells.items) {
        selectedUpsells = {
            items: {},
            total: 0
        };
    }

    // Renderizar upsells
    function renderUpsells() {
        container.innerHTML = '';
        
        SiteConfig.upsells.forEach(upsell => {
            const isSelected = selectedUpsells.items[upsell.id] || false;
            
            const div = document.createElement('div');
            div.className = `upsell-item ${isSelected ? 'selected' : ''}`;
            div.dataset.id = upsell.id;
            
            div.innerHTML = `
                <div class="upsell-radio ${isSelected ? 'active' : ''}"></div>
                <img src="${upsell.image}" class="upsell-image" alt="${upsell.name}">
                <div class="upsell-details">
                    <span class="upsell-name">${upsell.name}</span>
                    <span class="upsell-description">${upsell.description}</span>
                    <div class="upsell-prices">
                        <span class="upsell-old-price">R$ ${upsell.priceOriginal.toFixed(2).replace('.', ',')}</span>
                        <span class="upsell-new-price">R$ ${upsell.priceCurrent.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                toggleUpsell(upsell.id);
            });
            
            container.appendChild(div);
        });
        
        updateSummary();
    }

    // Alternar seleção do upsell
    function toggleUpsell(upsellId) {
        const upsell = SiteConfig.upsells.find(u => u.id === upsellId);
        
        if (!selectedUpsells.items[upsellId]) {
            // Adicionar
            selectedUpsells.items[upsellId] = {
                id: upsell.id,
                name: upsell.name,
                price: upsell.priceCurrent,
                added: true
            };
        } else {
            // Remover
            delete selectedUpsells.items[upsellId];
        }
        
        renderUpsells();
    }

    // Atualizar resumo
    function updateSummary() {
        const mainProduct = parseFloat(SiteConfig.product.priceCurrent);
        const shippingData = storage.get('shipping_data');
        const shippingPrice = shippingData.price || 0;
        
        // Calcular total dos upsells
        let upsellsTotal = 0;
        Object.values(selectedUpsells.items).forEach(item => {
            upsellsTotal += item.price;
        });
        
        selectedUpsells.total = upsellsTotal;
        
        const total = mainProduct + shippingPrice + upsellsTotal;

        // Atualizar UI
        document.getElementById('summary-main-product').textContent = 
            mainProduct.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-shipping').textContent = 
            shippingPrice === 0 ? 'Grátis' : shippingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-upsells').textContent = 
            upsellsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-total').textContent = 
            total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Botão "Continuar para Pagamento"
    btnContinue.addEventListener('click', () => {
        // Salvar upsells no storage
        storage.set('upsell_data', selectedUpsells);

        // Calcular novo total
        const shippingData = storage.get('shipping_data');
        const mainProduct = parseFloat(SiteConfig.product.priceCurrent);
        const shippingPrice = shippingData.price || 0;
        const total = mainProduct + shippingPrice + selectedUpsells.total;

        // Atualizar cookie e localStorage do carrinho
        localStorage.setItem('valor_total_carrinho', total.toFixed(2));
        document.cookie = `valor_total_carrinho=${total.toFixed(2)};path=/`;

        console.log("Redirecionando para pagamento com upsells...");
        window.location.href = 'pagamento.html' + window.location.search;
    });

    // Pular upsells
    const skipLink = document.getElementById('skip-upsells');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            storage.set('upsell_data', { items: {}, total: 0 });
            window.location.href = 'pagamento.html' + window.location.search;
        });
    }

    // Inicializar
    renderUpsells();
}

// Detectar qual página carregar
const path = window.location.pathname;
if (path.includes('endereco.html')) initAddress();
if (path.includes('pagamento.html')) initPayment();
if (path.includes('frete.html')) initShipping();
if (path.includes('upsells.html')) initUpsells();

// Inicializar botões de voltar (sempre)
document.addEventListener('DOMContentLoaded', initBackButtons);