(function () {
    "use strict";

    const SUPABASE_URL = "https://qsaowltbnefzpbphhwmr.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYW93bHRibmVmenBicGhod21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTM4MzEsImV4cCI6MjA5MTY2OTgzMX0.9VQz9QSZMXjkYDG10FcAFKgDfHVJmurulfWXm7DyExY";
    const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/public-race-interest`;

    const MODALITY_LABELS = {
        run: "Corrida",
        trail_run: "Trail Run",
        triathlon: "Triathlon",
        bike: "Ciclismo",
        cycling: "Ciclismo",
        swim: "Natacao",
        swimming: "Natacao",
        duathlon: "Duathlon",
        aquathlon: "Aquathlon"
    };

    const selectors = {
        search: document.getElementById("calendario-busca"),
        filters: document.getElementById("calendario-modalidades"),
        cards: document.getElementById("cards-container"),
        status: document.getElementById("calendario-status"),
        outsideButton: document.getElementById("calendario-prova-fora")
    };

    if (!selectors.search || !selectors.filters || !selectors.cards || !selectors.status) {
        return;
    }

    const state = {
        events: [],
        coaches: [],
        search: "",
        modality: "all",
        modalOverlay: null,
        modalBody: null
    };

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        createModal();
        bindEvents();
        await loadCalendar();
    }

    function bindEvents() {
        selectors.search.addEventListener("input", function (event) {
            state.search = event.target.value.trim().toLowerCase();
            renderEvents();
        });

        selectors.filters.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-modality]");
            if (!button) return;
            state.modality = button.dataset.modality;
            renderFilters();
            renderEvents();
        });

        selectors.cards.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-event-id]");
            if (!button) return;
            const found = state.events.find((item) => item.editionId === button.dataset.eventId);
            if (found) openCourseChooser(found);
        });

        selectors.outsideButton?.addEventListener("click", openOutsideRaceForm);
    }

    async function loadCalendar() {
        setStatus("Carregando provas do EON Hub...");

        try {
            const today = toIsoDate(getTodayLocalDate());
            const [series, editions, courses, coaches] = await Promise.all([
                fetchRows("race_series", "id,name,city,state,country,main_modality,modality,image_url,logo_url,website_url,is_active,active,is_deleted", {
                    limit: "5000"
                }),
                fetchRows("race_event_editions", "id,series_id,race_series_id,year,is_official,is_public,active,is_deleted,image_url,website_url,city,state,country,name,short_name", {
                    is_official: "eq.true",
                    is_deleted: "neq.true",
                    active: "neq.false",
                    limit: "5000"
                }),
                fetchRows("race_courses", "id,race_event_edition_id,name,short_label,distance_km,total_distance_km,race_date,modality,is_active,is_deleted", {
                    race_date: `gte.${today}`,
                    is_active: "neq.false",
                    is_deleted: "neq.true",
                    order: "race_date.asc",
                    limit: "5000"
                }),
                fetchRows("coaches", "id,name,active,show_on_site,role,roles", {
                    active: "eq.true",
                    show_on_site: "eq.true",
                    order: "name.asc",
                    limit: "500"
                })
            ]);

            state.events = buildEvents(series, editions, courses);
            state.coaches = filterCoaches(coaches);
            renderFilters();
            renderEvents();
        } catch (error) {
            console.error("[calendario] Erro ao carregar dados do EON Hub", error);
            setStatus("Nao foi possivel carregar as provas agora. Tente atualizar a pagina em alguns instantes.", true);
        }
    }

    async function fetchRows(table, columns, params) {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
        url.searchParams.set("select", columns);
        Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, value));

        const response = await fetch(url.toString(), {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`${table}: ${response.status} ${text}`);
        }

        return response.json();
    }

    function buildEvents(seriesRows, editionRows, courseRows) {
        const seriesById = new Map(seriesRows
            .filter((item) => item && item.is_deleted !== true && item.is_active !== false && item.active !== false)
            .map((item) => [item.id, item]));
        const editionsById = new Map(editionRows
            .filter((item) => item && item.is_deleted !== true && item.active !== false && item.is_official === true)
            .map((item) => [item.id, item]));
        const groups = new Map();

        courseRows
            .filter((course) => course && course.is_deleted !== true && course.is_active !== false && course.race_date)
            .forEach((course) => {
                const edition = editionsById.get(course.race_event_edition_id);
                if (!edition) return;

                const series = seriesById.get(edition.series_id || edition.race_series_id);
                if (!series) return;

                if (!groups.has(edition.id)) {
                    groups.set(edition.id, {
                        editionId: edition.id,
                        edition,
                        series,
                        name: series.name || edition.short_name || edition.name || "Prova",
                        year: edition.year || "",
                        city: series.city || edition.city || "",
                        state: series.state || edition.state || "",
                        country: series.country || edition.country || "Brasil",
                        modality: series.main_modality || series.modality || course.modality || "",
                        imageUrl: edition.image_url || series.image_url || series.logo_url || "",
                        websiteUrl: edition.website_url || series.website_url || "",
                        courses: [],
                        nextDate: course.race_date,
                        minDate: parseDateLocal(course.race_date)
                    });
                }

                const group = groups.get(edition.id);
                group.courses.push(course);

                const courseDate = parseDateLocal(course.race_date);
                if (courseDate && (!group.minDate || courseDate < group.minDate)) {
                    group.minDate = courseDate;
                    group.nextDate = course.race_date;
                }
            });

        return Array.from(groups.values())
            .map((event) => ({
                ...event,
                courses: event.courses.sort(compareCourses)
            }))
            .sort((a, b) => (a.minDate || 0) - (b.minDate || 0));
    }

    function filterCoaches(rows) {
        const visibleCoachRoles = new Set(["coach", "head_coach"]);
        return rows
            .filter((coach) => {
                if (!coach || coach.active !== true || coach.show_on_site !== true) return false;
                if (visibleCoachRoles.has(String(coach.role || ""))) return true;
                return normalizeRoles(coach.roles).some((role) => visibleCoachRoles.has(role));
            })
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));
    }

    function normalizeRoles(value) {
        if (Array.isArray(value)) return value.map((role) => String(role || ""));
        if (typeof value === "string" && value.trim()) {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.map((role) => String(role || "")) : [];
            } catch {
                return [value];
            }
        }
        return [];
    }

    function compareCourses(a, b) {
        const dateCompare = String(a.race_date || "").localeCompare(String(b.race_date || ""));
        if (dateCompare !== 0) return dateCompare;
        return Number(a.distance_km || a.total_distance_km || 0) - Number(b.distance_km || b.total_distance_km || 0);
    }

    function renderFilters() {
        const modalities = ["all", ...new Set(state.events.map((event) => event.modality).filter(Boolean))];
        selectors.filters.innerHTML = modalities.map((modality) => {
            const label = modality === "all" ? "Todas" : getModalityLabel(modality);
            const active = state.modality === modality ? " active" : "";
            return `<button type="button" class="${active.trim()}" data-modality="${escapeAttr(modality)}">${escapeHtml(label)}</button>`;
        }).join("");
    }

    function renderEvents() {
        const filtered = state.events.filter((event) => {
            const searchTarget = `${event.name} ${event.city} ${event.state} ${event.courses.map((course) => course.name).join(" ")}`.toLowerCase();
            const matchesSearch = !state.search || searchTarget.includes(state.search);
            const matchesModality = state.modality === "all" ||
                event.modality === state.modality ||
                event.courses.some((course) => course.modality === state.modality);
            return matchesSearch && matchesModality;
        });

        if (state.events.length === 0) {
            setStatus("");
            selectors.cards.innerHTML = emptyState("Nenhuma prova futura encontrada no EON Hub.");
            return;
        }

        setStatus("");

        if (filtered.length === 0) {
            selectors.cards.innerHTML = emptyState("Nenhuma prova encontrada com esses filtros.");
            return;
        }

        selectors.cards.innerHTML = filtered.map(renderEventCard).join("");
        selectors.cards.querySelectorAll(".prova-media img").forEach((image) => {
            image.addEventListener("error", function () {
                const media = image.closest(".prova-media");
                if (media) {
                    const tag = media.querySelector(".prova-tag");
                    media.innerHTML = renderImagePlaceholder(image.alt || "Prova");
                    if (tag) media.appendChild(tag);
                }
            }, { once: true });
        });
    }

    function renderEventCard(event) {
        const location = [event.city, event.state].filter(Boolean).join(", ") || "Local a definir";
        const courseLabels = event.courses.slice(0, 8).map((course) => {
            return `<span>${escapeHtml(getCourseLabel(course))}</span>`;
        }).join("");
        const extraCourses = event.courses.length > 8 ? `<span>+${event.courses.length - 8}</span>` : "";
        const imageUrl = getUsableImageUrl(event.imageUrl);
        const image = imageUrl
            ? `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(event.name)}" loading="lazy">`
            : renderImagePlaceholder(event.name);

        return `
            <article class="prova-card">
                <div class="prova-media">
                    ${image}
                    <span class="prova-tag">${escapeHtml(getModalityLabel(event.modality))}</span>
                </div>
                <div class="prova-content">
                    <h3>${escapeHtml(event.name)}${event.year ? ` ${escapeHtml(String(event.year))}` : ""}</h3>
                    <div class="prova-info">
                        <div><i class="fas fa-location-dot" aria-hidden="true"></i><span>${escapeHtml(location)}</span></div>
                        <div><i class="fas fa-calendar-day" aria-hidden="true"></i><span>${escapeHtml(getEventDateLabel(event))}</span></div>
                    </div>
                    <div class="prova-courses">${courseLabels}${extraCourses}</div>
                    <button class="prova-action" type="button" data-event-id="${escapeAttr(event.editionId)}">
                        Participar <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            </article>
        `;
    }

    function renderImagePlaceholder(name) {
        return `
            <div class="prova-media-placeholder">
                <i class="fas fa-flag-checkered" aria-hidden="true"></i>
                <span>${escapeHtml(name || "Calendario de provas")}</span>
            </div>
        `;
    }

    function emptyState(message) {
        return `
            <div class="calendario-empty">
                <i class="far fa-calendar-xmark" aria-hidden="true"></i>
                <strong>${escapeHtml(message)}</strong>
            </div>
        `;
    }

    function openCourseChooser(event) {
        if (event.courses.length === 1) {
            openOfficialForm(event, event.courses[0]);
            return;
        }

        openModal("Escolha o percurso", `
            <div class="calendario-modal-lead">
                <strong>${escapeHtml(event.name)}${event.year ? ` ${escapeHtml(String(event.year))}` : ""}</strong><br>
                ${escapeHtml([event.city, event.state].filter(Boolean).join(", ") || "Local a definir")}
            </div>
            <div class="calendario-course-list">
                ${event.courses.map((course) => `
                    <button class="calendario-course-button" type="button" data-course-id="${escapeAttr(course.id)}">
                        <span>
                            <strong>${escapeHtml(getCourseLabel(course))}</strong>
                            <small>${escapeHtml(formatDateBR(course.race_date))}</small>
                        </span>
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                `).join("")}
            </div>
        `);

        state.modalBody.querySelectorAll("[data-course-id]").forEach((button) => {
            button.addEventListener("click", function () {
                const course = event.courses.find((item) => item.id === button.dataset.courseId);
                if (course) openOfficialForm(event, course);
            });
        });
    }

    function openOfficialForm(event, course) {
        openModal("Manifestar interesse", `
            <div class="calendario-modal-lead">
                <strong>${escapeHtml(getCourseLabel(course))}</strong><br>
                ${escapeHtml(event.name)}${event.year ? ` ${escapeHtml(String(event.year))}` : ""} - ${escapeHtml(formatDateBR(course.race_date))}
            </div>
            <form class="calendario-form" id="calendario-form-oficial">
                ${renderCommonFields()}
                <label>
                    Distancia da prova
                    <input type="text" value="${escapeAttr(getCourseLabel(course))}" readonly>
                </label>
                ${renderDebutFields()}
                <div class="calendario-form-message" data-form-message></div>
                <button class="calendario-submit" type="submit">Confirmar interesse</button>
            </form>
        `);

        const form = document.getElementById("calendario-form-oficial");
        form.addEventListener("submit", async function (submitEvent) {
            submitEvent.preventDefault();
            const data = new FormData(form);
            await submitForm(form, {
                type: "official",
                raceCourseId: course.id,
                coachId: data.get("coachId"),
                athleteName: data.get("athleteName"),
                isModalityDebut: data.get("isModalityDebut") === "yes",
                isDistanceDebut: data.get("isDistanceDebut") === "yes"
            });
        });
    }

    function openOutsideRaceForm() {
        openModal("Prova fora do calendario", `
            <form class="calendario-form" id="calendario-form-fora">
                ${renderCommonFields()}
                <label>
                    Nome da prova *
                    <input name="eventName" type="text" minlength="3" maxlength="180" required>
                </label>
                <label>
                    Modalidade *
                    <select name="modality" required>
                        <option value="">Selecione</option>
                        ${Object.entries(MODALITY_LABELS).map(([value, label]) => `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`).join("")}
                    </select>
                </label>
                <label>
                    Distancia *
                    <input name="distanceText" type="text" maxlength="80" placeholder="Ex.: 21K, Sprint, 70.3" required>
                </label>
                <label>
                    Data da prova *
                    <input name="raceDate" type="date" required>
                </label>
                <label>
                    Cidade
                    <input name="city" type="text" maxlength="80">
                </label>
                <label>
                    Estado
                    <input name="state" type="text" maxlength="40">
                </label>
                ${renderDebutFields()}
                <div class="calendario-form-message" data-form-message></div>
                <button class="calendario-submit" type="submit">Enviar para meu treinador</button>
            </form>
        `);

        const form = document.getElementById("calendario-form-fora");
        form.addEventListener("submit", async function (submitEvent) {
            submitEvent.preventDefault();
            const data = new FormData(form);
            await submitForm(form, {
                type: "outside",
                coachId: data.get("coachId"),
                athleteName: data.get("athleteName"),
                eventName: data.get("eventName"),
                modality: data.get("modality"),
                distanceText: data.get("distanceText"),
                raceDate: data.get("raceDate"),
                city: data.get("city"),
                state: data.get("state"),
                country: "Brasil",
                isModalityDebut: data.get("isModalityDebut") === "yes",
                isDistanceDebut: data.get("isDistanceDebut") === "yes"
            });
        });
    }

    function renderCommonFields() {
        return `
            <label>
                Nome do atleta *
                <input name="athleteName" type="text" minlength="3" maxlength="120" autocomplete="name" required>
            </label>
            <label>
                Treinador *
                <select name="coachId" required>
                    <option value="">Selecione seu treinador</option>
                    ${state.coaches.map((coach) => `<option value="${escapeAttr(coach.id)}">${escapeHtml(coach.name)}</option>`).join("")}
                </select>
            </label>
        `;
    }

    function renderDebutFields() {
        return `
            <label>
                Estreia na modalidade? *
                <select name="isModalityDebut" required>
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Nao</option>
                </select>
            </label>
            <label>
                Estreia na distancia? *
                <select name="isDistanceDebut" required>
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Nao</option>
                </select>
            </label>
        `;
    }

    async function submitForm(form, payload) {
        const button = form.querySelector(".calendario-submit");
        const message = form.querySelector("[data-form-message]");
        button.disabled = true;
        button.textContent = "Enviando...";
        showFormMessage(message, "", "");

        try {
            const response = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.ok !== true) {
                throw new Error(result.error || "Nao foi possivel registrar seu interesse.");
            }

            showSuccessModal(result.deduplicated);
        } catch (error) {
            showFormMessage(message, error.message || "Erro ao enviar. Tente novamente.", "error");
        } finally {
            button.disabled = false;
            button.textContent = payload.type === "outside" ? "Enviar para meu treinador" : "Confirmar interesse";
        }
    }

    function showSuccessModal(wasDeduplicated) {
        const title = wasDeduplicated ? "Interesse já registrado" : "Interesse registrado";
        const message = wasDeduplicated
            ? "Seu treinador já consegue visualizar esse interesse no EON Hub."
            : "Obrigado. Seu treinador já consegue visualizar sua participação no EON Hub.";

        openModal(title, `
            <div class="calendario-success">
                <div class="calendario-success-icon">
                    <i class="fas fa-check" aria-hidden="true"></i>
                </div>
                <p>${escapeHtml(message)}</p>
                <button class="calendario-submit calendario-success-back" type="button">Voltar ao calendário</button>
            </div>
        `);

        const backButton = state.modalBody.querySelector(".calendario-success-back");
        backButton?.addEventListener("click", closeModal);
    }

    function showFormMessage(element, text, type) {
        element.textContent = text;
        element.className = "calendario-form-message";
        if (text) {
            element.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
        }
    }

    function createModal() {
        const overlay = document.createElement("div");
        overlay.className = "calendario-modal-overlay";
        overlay.innerHTML = `
            <div class="calendario-modal" role="dialog" aria-modal="true" aria-labelledby="calendario-modal-title">
                <button class="calendario-modal-close" type="button" aria-label="Fechar">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <h3 id="calendario-modal-title"></h3>
                <div data-modal-body></div>
            </div>
        `;

        document.body.appendChild(overlay);
        state.modalOverlay = overlay;
        state.modalBody = overlay.querySelector("[data-modal-body]");

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay || event.target.closest(".calendario-modal-close")) {
                closeModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && overlay.classList.contains("is-open")) {
                closeModal();
            }
        });
    }

    function openModal(title, bodyHtml) {
        state.modalOverlay.querySelector("#calendario-modal-title").textContent = title;
        state.modalBody.innerHTML = bodyHtml;
        state.modalOverlay.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        state.modalOverlay.classList.remove("is-open");
        document.body.style.overflow = "";
        state.modalBody.innerHTML = "";
    }

    function setStatus(message, isError) {
        selectors.status.textContent = message;
        selectors.status.classList.toggle("is-error", Boolean(isError));
        selectors.status.style.display = message ? "block" : "none";
    }

    function getCourseLabel(course) {
        return course.short_label || course.name || "Percurso";
    }

    function getModalityLabel(value) {
        return MODALITY_LABELS[value] || value || "Modalidade";
    }

    function getUsableImageUrl(value) {
        if (!value) return "";
        try {
            const url = new URL(value, window.location.href);
            return url.href;
        } catch {
            return "";
        }
    }

    function getTodayLocalDate() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function getEventDateLabel(event) {
        const dates = getUniqueCourseDates(event);
        if (dates.length === 0) return "Data a definir";
        if (dates.length === 1) return formatDateBR(dates[0]);
        if (dates.length === 2) return formatTwoDates(dates[0], dates[1]);
        return formatDateRange(dates[0], dates[dates.length - 1]);
    }

    function getUniqueCourseDates(event) {
        const seen = new Set();
        return (event.courses || [])
            .map((course) => course.race_date)
            .filter((value) => {
                if (!value || seen.has(value) || !parseDateLocal(value)) return false;
                seen.add(value);
                return true;
            })
            .sort();
    }

    function formatTwoDates(startValue, endValue) {
        const start = parseDateLocal(startValue);
        const end = parseDateLocal(endValue);
        if (!start || !end) return formatDateBR(startValue);
        if (start.getFullYear() === end.getFullYear()) {
            return `${formatDayMonth(startValue)} e ${formatDayMonth(endValue)}/${end.getFullYear()}`;
        }
        return `${formatDateBR(startValue)} e ${formatDateBR(endValue)}`;
    }

    function formatDateRange(startValue, endValue) {
        const start = parseDateLocal(startValue);
        const end = parseDateLocal(endValue);
        if (!start || !end) return formatDateBR(startValue);

        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
            return `${String(start.getDate()).padStart(2, "0")} a ${formatDayMonth(endValue)}/${end.getFullYear()}`;
        }
        if (start.getFullYear() === end.getFullYear()) {
            return `${formatDayMonth(startValue)} a ${formatDayMonth(endValue)}/${end.getFullYear()}`;
        }
        return `${formatDateBR(startValue)} a ${formatDateBR(endValue)}`;
    }

    function formatDayMonth(value) {
        const date = parseDateLocal(value);
        if (!date) return "Data a definir";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
    }

    function parseDateLocal(value) {
        const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    function toIsoDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function formatDateBR(value) {
        const date = parseDateLocal(value);
        if (!date) return "Data a definir";
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }
})();
