/* ── LocalStorage ── */
function saveProgress(t) {
    try { localStorage.setItem("videoplayer", String(t)); } catch (_) {}
}
function loadProgress() {
    try { return parseFloat(localStorage.getItem("videoplayer")) || 0; } catch (_) { return 0; }
}
function clearProgress() {
    try { localStorage.removeItem("videoplayer"); } catch (_) {}
}
function hasVisited() {
    try { return !!localStorage.getItem("videoplayer_visited"); } catch (_) { return false; }
}
function setVisited() {
    try { localStorage.setItem("videoplayer_visited", "1"); } catch (_) {}
}

/* ── Detect mobile/touch ── */
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || ('ontouchstart' in window);

/* ── DOM ── */
var wrap        = document.getElementById("player-wrap");
var vid         = document.getElementById("vid");
var loading     = document.getElementById("loading");
var loadPct     = document.getElementById("load-pct");
var posterWrap  = document.getElementById("poster-wrap");
var aoOverlay   = document.getElementById("autoplay-overlay");
var resumeDialog= document.getElementById("resume-dialog");
var btnReplay   = document.getElementById("btn-replay");
var btnResume   = document.getElementById("btn-resume");
var btnPlay     = document.getElementById("btn-play");
var iconPlay    = document.getElementById("icon-play");
var iconPause   = document.getElementById("icon-pause");
var btnMute     = document.getElementById("btn-mute");
var volSlider   = document.getElementById("vol-slider");
var timeDisplay = document.getElementById("time-display");
var progressWrap= document.getElementById("progress-wrap");
var fakeBar     = document.getElementById("fake-bar");
var realBar     = document.getElementById("real-bar");
var btnFs       = document.getElementById("btn-fs");

/* Esconde volume slider no mobile */
if (isMobile) {
    var volWrap = document.getElementById("vol-wrap");
    if (volWrap) volWrap.style.display = "none";
}

posterWrap.style.backgroundImage = "url('./video/cover.jpg')";

/* ── LOADING ── */
var loadProgressPct = 0;
var onReadyCalled = false;

function updateLoading(pct) {
    loadProgressPct = Math.min(100, pct);
    loadPct.textContent = Math.floor(loadProgressPct) + "%";
}

/* Fallback: remove loading após 8s */
var loadingFallback = setTimeout(function() {
    updateLoading(100);
    loading.classList.add("hidden");
    if (vid.paused) {
        posterWrap.classList.remove("hidden");
        posterWrap.style.cursor = "pointer";
        showPlayOnPosterHint();
    }
}, 8000);

/* Ícone de play no poster para mobile */
function showPlayOnPosterHint() {
    if (document.getElementById("poster-play-icon")) return;
    var icon = document.createElement("div");
    icon.id = "poster-play-icon";
    icon.innerHTML = '<svg viewBox="0 0 24 24" style="width:64px;height:64px;fill:rgba(255,255,255,0.9);filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))"><path d="M8 5v14l11-7z"/></svg>';
    icon.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:75;pointer-events:none;";
    posterWrap.appendChild(icon);
}

/* ── Init player ── */
function initPlayer() {
    var savedTime = loadProgress();

    function onReady() {
        if (onReadyCalled) return;
        onReadyCalled = true;
        clearTimeout(loadingFallback);
        updateLoading(100);
        loading.classList.add("hidden");

        if (savedTime > 5) {
            showResumeDialog(savedTime);
        } else {
            startPlayback(0);
        }
    }

    /* Atributos essenciais para iOS */
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.setAttribute("preload", "auto");

    vid.src = "./videos/premiado.mp4";

    /* Progresso real do carregamento */
    vid.addEventListener("progress", function() {
        try {
            if (vid.buffered.length > 0 && vid.duration > 0) {
                var bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
                updateLoading((bufferedEnd / vid.duration) * 100);
            }
        } catch (_) {}
    });

    /* Múltiplos eventos para garantir que detecte no mobile/iOS */
    vid.addEventListener("loadeddata",     onReady, { once: true });
    vid.addEventListener("canplay",        onReady, { once: true });
    vid.addEventListener("canplaythrough", onReady, { once: true });

    vid.addEventListener("loadedmetadata", function() {
        setTimeout(function() { if (!onReadyCalled) onReady(); }, 2000);
    }, { once: true });
}

/* ── Resume dialog ── */
function showResumeDialog(savedTime) {
    resumeDialog.classList.remove("hidden");
    btnResume.onclick = function() {
        resumeDialog.classList.add("hidden");
        startPlayback(savedTime, true);
    };
    btnReplay.onclick = function() {
        clearProgress();
        resumeDialog.classList.add("hidden");
        startPlayback(0, true);
    };
}

/* ── Start playback ── */
function tryPlay(muted, onSuccess, onFail) {
    vid.muted = muted;
    var p = vid.play();
    if (p && typeof p.then === "function") {
        p.then(onSuccess).catch(onFail);
    } else {
        onSuccess();
    }
}

function startPlayback(seekTo, withSound) {
    vid.currentTime = seekTo;

    if (withSound) {
        setVisited();
        tryPlay(false, function() {
            posterWrap.classList.add("hidden");
        }, function() {
            tryPlay(true, function() {
                posterWrap.classList.add("hidden");
                aoOverlay.classList.remove("hidden");
            }, function() {
                posterWrap.classList.remove("hidden");
                posterWrap.style.cursor = "pointer";
                showPlayOnPosterHint();
            });
        });
    } else {
        tryPlay(true, function() {
            posterWrap.classList.add("hidden");
            aoOverlay.classList.remove("hidden");
        }, function() {
            /* Mobile bloqueou autoplay: mostra poster clicável */
            posterWrap.classList.remove("hidden");
            posterWrap.style.cursor = "pointer";
            showPlayOnPosterHint();
        });
    }
}

/* ── Clique no poster para iniciar (mobile) ── */
posterWrap.addEventListener("click", function() {
    var icon = document.getElementById("poster-play-icon");
    if (icon) icon.remove();
    posterWrap.style.cursor = "";
    setVisited();
    vid.muted = false;
    vid.currentTime = 0;
    tryPlay(false, function() {
        posterWrap.classList.add("hidden");
    }, function() {
        tryPlay(true, function() {
            posterWrap.classList.add("hidden");
            aoOverlay.classList.remove("hidden");
        }, function() {});
    });
});

/* ── Overlay de autoplay ── */
wrap.addEventListener("click", function(e) {
    if (!aoOverlay.classList.contains("hidden")) {
        setVisited();
        vid.muted = false;
        volSlider.value = vid.volume;
        aoOverlay.classList.add("hidden");
        return;
    }
    if (e.target === wrap || e.target === vid) togglePlay();
});

/* ── Play/Pause ── */
function togglePlay() {
    if (vid.paused) vid.play();
    else vid.pause();
}

btnPlay.addEventListener("click", togglePlay);

vid.addEventListener("play", function() {
    iconPlay.style.display = "none";
    iconPause.style.display = "";
});
vid.addEventListener("pause", function() {
    iconPlay.style.display = "";
    iconPause.style.display = "none";
    wrap.classList.add("show-ctrl");
});
vid.addEventListener("ended", function() {
    clearProgress();
    iconPlay.style.display = "";
    iconPause.style.display = "none";
});

/* ── Progress bar ── */
var fakeBarPct = 0;

vid.addEventListener("timeupdate", function() {
    if (!vid.duration) return;
    var pct = (vid.currentTime / vid.duration) * 100;
    realBar.style.width = pct + "%";
    var target = Math.min(pct + 6, 100);
    if (target > fakeBarPct) fakeBarPct = target;
    fakeBar.style.width = fakeBarPct + "%";
    if (Math.floor(vid.currentTime) % 5 === 0) saveProgress(vid.currentTime);
    updateTime();
});

progressWrap.addEventListener("click", function(e) {
    if (!vid.duration) return;
    var rect = progressWrap.getBoundingClientRect();
    vid.currentTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
    saveProgress(vid.currentTime);
});

progressWrap.addEventListener("touchend", function(e) {
    if (!vid.duration) return;
    e.preventDefault();
    var touch = e.changedTouches[0];
    var rect = progressWrap.getBoundingClientRect();
    var pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    vid.currentTime = pos * vid.duration;
    saveProgress(vid.currentTime);
}, { passive: false });

/* ── Tempo ── */
function fmt(s) {
    s = Math.floor(s || 0);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function updateTime() {
    timeDisplay.textContent = fmt(vid.currentTime) + " / " + fmt(vid.duration);
}
vid.addEventListener("loadedmetadata", updateTime);

/* ── Volume ── */
btnMute.addEventListener("click", function() {
    vid.muted = !vid.muted;
    volSlider.value = vid.muted ? 0 : vid.volume;
});
volSlider.addEventListener("input", function() {
    vid.volume = parseFloat(volSlider.value);
    vid.muted = vid.volume === 0;
});

/* ── Fullscreen (iOS usa webkitEnterFullscreen no video) ── */
btnFs.addEventListener("click", function() {
    if (isMobile && vid.webkitEnterFullscreen) {
        vid.webkitEnterFullscreen();
        return;
    }
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (wrap.requestFullscreen) wrap.requestFullscreen();
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
});

/* ── Auto-show controles ── */
var ctrlTimer;
function showControls() {
    wrap.classList.add("show-ctrl");
    clearTimeout(ctrlTimer);
    ctrlTimer = setTimeout(function() {
        if (!vid.paused) wrap.classList.remove("show-ctrl");
    }, 3000);
}

wrap.addEventListener("mousemove", showControls);
wrap.addEventListener("touchstart", showControls, { passive: true });
vid.addEventListener("play", function() { if (isMobile) showControls(); });

/* ── Boot ── */
initPlayer();
