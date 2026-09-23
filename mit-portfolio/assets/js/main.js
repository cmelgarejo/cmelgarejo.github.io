document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('seniority').innerHTML = new Date(new Date() - new Date('2004-01-01')).getFullYear() - 1970;
});
