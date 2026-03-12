// achievements.js — SSG Badge System
(function() {
  'use strict';

  var BADGES_KEY = 'ssg_badges';

  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem(BADGES_KEY) || '[]'); } catch(e) { return []; }
  }

  function showPopup(badge) {
    var el = document.createElement('div');
    el.className = 'badge-popup';
    el.innerHTML = '<div class="badge-icon">' + badge.icon + '</div>' +
      '<div><div class="badge-title">🏅 ' + badge.name + '</div><div class="badge-desc">' + badge.desc + '</div></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { el.classList.add('show'); });
    });
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { el.parentNode && el.parentNode.removeChild(el); }, 500);
    }, 3000);
  }

  function unlockBadge(id) {
    var unlocked = getUnlocked();
    if (unlocked.indexOf(id) !== -1) return;
    // Load badge data
    fetch('data/badges.json').then(function(r){ return r.json(); }).then(function(badges) {
      var badge = badges.find(function(b){ return b.id === id; });
      if (!badge) return;
      unlocked.push(id);
      localStorage.setItem(BADGES_KEY, JSON.stringify(unlocked));
      showPopup(badge);
    }).catch(function(){});
  }

  function checkAchievements() {
    var hour = new Date().getHours();
    var unlocked = getUnlocked();

    function check(id, condition) {
      if (condition && unlocked.indexOf(id) === -1) unlockBadge(id);
    }

    check('early_bird', hour < 9);
    check('night_owl', hour >= 23);

    // on_fire: 3 different skills today
    try {
      var daily = JSON.parse(localStorage.getItem('ssg_daily_skills') || '[]');
      var today = new Date().toDateString();
      var todaySkills = daily.filter(function(e){ return e.date === today; });
      var uniqueSkills = todaySkills.filter(function(e, i, arr){
        return arr.findIndex(function(x){ return x.skillId === e.skillId; }) === i;
      });
      check('on_fire', uniqueSkills.length >= 3);
    } catch(e){}

    // perfectionist & finisher: any skill === 100
    try {
      var skills = JSON.parse(localStorage.getItem('ssg_skills_list') || 'null');
      if (!skills) {
        // scan all known skill keys
        var keys = Object.keys(localStorage).filter(function(k){ return k.startsWith('ssg_skill_'); });
        var anyHundred = keys.some(function(k){ return parseInt(localStorage.getItem(k)) === 100; });
        check('perfectionist', anyHundred);
        check('finisher', anyHundred);
        check('master', keys.length >= 22 && keys.every(function(k){ return parseInt(localStorage.getItem(k)) === 100; }));
      }
    } catch(e){}

    // explorer: all 4 districts visited
    try {
      var visited = JSON.parse(localStorage.getItem('ssg_districts_visited') || '[]');
      var allDistricts = ['communication','leadership','creative','personal'];
      check('explorer', allDistricts.every(function(d){ return visited.indexOf(d) !== -1; }));
    } catch(e){}

    // sniper: b1 perfect 3 times
    try {
      var b1count = parseInt(localStorage.getItem('ssg_b1_perfect_count') || '0');
      check('sniper', b1count >= 3);
    } catch(e){}
  }

  window.SSG = window.SSG || {};
  window.SSG.unlockBadge = unlockBadge;
  window.SSG.checkAchievements = checkAchievements;

  // Auto-run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAchievements);
  } else {
    checkAchievements();
  }
})();
