document.addEventListener('DOMContentLoaded', function () {
    const section = document.getElementById('planos-valores');
    if (!section) return;

    const endpoint = 'https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect';
    const modalityFilters = Array.from(section.querySelectorAll('.filtro-modalidade'));
    const periodFilters = Array.from(section.querySelectorAll('.filtro-periodo'));
    const filters = section.querySelector('.planos-filtros');
    const plansContainer = section.querySelector('.planos-container');
    const discount = section.querySelector('.desconto-info');
    const enrollment = section.querySelector('.taxa-matricula-info');
    const existingNoVacancies = section.querySelector('.aviso-sem-vagas');
    const profileSlug = window.location.pathname.split('/').pop().replace(/\.html$/, '');
    const coachAliases = { 'jessica-rodrigues': 'jessica-vieira' };
    const wantedCoachSlug = coachAliases[profileSlug] || profileSlug;
    const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const feeMoney = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const slug = (value) => String(value || '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const periods = ['mensal', 'trimestral', 'semestral'];
    const fields = {
        mensal: ['essencial-mensal-preco', null, 'essencial-link-mensal'],
        trimestral: ['essencial-trimestral-preco', 'essencial-trimestral-equivalente', 'essencial-link-trimestral'],
        semestral: ['essencial-semestral-preco', 'essencial-semestral-equivalente', 'essencial-link-semestral']
    };
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.textAlign = 'center';
    status.style.margin = '20px 0';
    filters.before(status);

    let catalog = null;
    let coach = null;

    function visible(node, shouldShow) {
        if (node) node.style.display = shouldShow ? '' : 'none';
    }

    function showState(message) {
        status.textContent = message;
        visible(filters, false);
        visible(plansContainer, false);
        visible(discount, false);
        visible(enrollment, false);
    }

    function planFor(modality, period) {
        const record = catalog?.modalities.find((item) => slug(item.name) === modality);
        if (!record || !coach.modality_ids.includes(record.id)) return null;
        return catalog.plans.find((plan) =>
            plan.modality_id === record.id && plan.id &&
            plan.active !== false && plan.available_online !== false &&
            !slug(plan.name).includes('essencial') && slug(plan.period) === period &&
            Number(plan.price_monthly) > 0 && Number(plan.price_total) > 0
        ) || null;
    }

    function selectedModality() {
        return section.querySelector('.filtro-modalidade.ativo')?.dataset.modalidade || modalityFilters[0]?.dataset.modalidade;
    }

    function selectedPeriod() {
        return section.querySelector('.filtro-periodo.ativo')?.dataset.periodo || 'mensal';
    }

    function updateEnrollment(period) {
        if (!enrollment) return;
        const plan = planFor(selectedModality(), period || selectedPeriod());
        if (!plan) return;
        const fee = Number(plan.enrollment_fee) || 0;
        enrollment.textContent = fee > 0
            ? `Taxa de Matrícula: R$ ${feeMoney.format(fee)} (valor único, adicionado à primeira cobrança).`
            : 'Sem taxa de matrícula.';
    }

    function renderModality() {
        if (!catalog || !coach) return;
        const modality = selectedModality();
        const plans = periods.map((period) => planFor(modality, period));
        if (!plans.some(Boolean)) {
            showState('Não há planos online disponíveis com este treinador para esta modalidade no momento.');
            return;
        }

        status.textContent = '';
        visible(filters, true);
        visible(plansContainer, true);
        visible(discount, true);
        visible(enrollment, true);

        periods.forEach((period, index) => {
            const plan = plans[index];
            const [priceId, equivalentId, linkClass] = fields[period];
            const card = section.querySelector(`.periodo-card[data-periodo="${period}"]`);
            const filter = periodFilters.find((item) => item.dataset.periodo === period);
            if (filter) filter.style.display = plan ? '' : 'none';
            if (!plan) {
                if (card) card.style.display = 'none';
                return;
            }

            const price = document.getElementById(priceId);
            if (price) price.textContent = money.format(Number(plan.price_total));
            const equivalent = equivalentId && document.getElementById(equivalentId);
            if (equivalent) equivalent.textContent = `Equivale a R$ ${money.format(Number(plan.price_monthly))}/mês`;
            const installments = card?.querySelector('.periodo-parcelas');
            if (installments) installments.textContent = `Em até ${Number(plan.max_installments) || Number(plan.period_months) || 1}x`;

            const link = card?.querySelector(`.${linkClass}`);
            if (link) {
                const url = new URL('../cadastro-unificado.html', window.location.href);
                url.searchParams.set('modalidade', modality);
                url.searchParams.set('periodicidade', period);
                url.searchParams.set('plan_id', String(plan.id));
                url.searchParams.set('treinador', slug(coach.name));
                link.href = url.href;
            }
        });

        if (!planFor(modality, selectedPeriod())) {
            const firstAvailable = periodFilters.find((filter) => filter.style.display !== 'none');
            if (firstAvailable) firstAvailable.click();
        }
        updateEnrollment();
    }

    function renderCatalog() {
        coach = catalog.coaches.find((item) =>
            item.id && item.active !== false && item.public_visible !== false &&
            Array.isArray(item.modality_ids) && slug(item.name) === wantedCoachSlug
        );
        if (!coach) {
            showState(existingNoVacancies ? '' : 'Este treinador não está disponível para contratação online no momento.');
            return;
        }
        modalityFilters.forEach((filter) => {
            const record = catalog.modalities.find((item) => slug(item.name) === filter.dataset.modalidade);
            filter.style.display = record && coach.modality_ids.includes(record.id) &&
                periods.some((period) => planFor(filter.dataset.modalidade, period)) ? '' : 'none';
        });
        const current = section.querySelector('.filtro-modalidade.ativo');
        if (current?.style.display === 'none') {
            current.classList.remove('ativo');
            const firstAvailable = modalityFilters.find((filter) => filter.style.display !== 'none');
            if (firstAvailable) firstAvailable.classList.add('ativo');
        }
        if (!modalityFilters.some((filter) => filter.style.display !== 'none')) {
            showState('Não há planos online disponíveis com este treinador no momento.');
            return;
        }
        renderModality();
    }

    showState('Carregando planos disponíveis...');
    modalityFilters.forEach((filter) => filter.addEventListener('click', function () {
        if (this.style.display === 'none' || !catalog || !coach) return;
        modalityFilters.forEach((item) => item.classList.toggle('ativo', item === this));
        renderModality();
    }));
    periodFilters.forEach((filter) => filter.addEventListener('click', function () {
        updateEnrollment(this.dataset.periodo);
    }));

    void (async function loadCatalog() {
        try {
            const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error('Catálogo indisponível');
            catalog = {
                modalities: Array.isArray(data.modalities) ? data.modalities : [],
                plans: Array.isArray(data.plans) ? data.plans : [],
                coaches: Array.isArray(data.coaches) ? data.coaches : []
            };
            renderCatalog();
        } catch (error) {
            console.error('trainer assessment catalog', error);
            showState('Não foi possível carregar os planos agora. Atualize a página e tente novamente.');
        }
    })();
});
