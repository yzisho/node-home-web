/* NODE LEGION v2-simpler — minimal JS: mobile menu + footer year */
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("is-open");
});
document.getElementById("navLinks").addEventListener("click", (e) => {
  if (e.target.tagName === "A") document.getElementById("navLinks").classList.remove("is-open");
});
document.getElementById("year").textContent = new Date().getFullYear();
