const rooms = [...document.querySelectorAll(".room")];
const journey = document.querySelector(".journey");
const progress = document.getElementById("jProgress");
const cursor = document.getElementById("cursor");
const heroBg = document.getElementById("heroBg");

let current = 0;

function setRoom(i) {
  if (i === current) return;
  rooms.forEach((r, idx) => r.classList.toggle("active", idx === i));
  current = i;
}

function onScroll() {
  const y = window.scrollY;
  if (heroBg) {
    heroBg.style.transform = `scale(${1.08 + Math.min(y, 800) / 4000}) translate3d(0, ${y * 0.12}px, 0)`;
  }

  if (!journey) return;
  const start = journey.offsetTop;
  const end = start + journey.offsetHeight - window.innerHeight;
  const t = Math.min(1, Math.max(0, (y - start) / (end - start || 1)));
  const i = Math.min(rooms.length - 1, Math.floor(t * rooms.length));
  setRoom(i);
  if (progress) progress.style.setProperty("--p", `${t * 100}%`);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

window.addEventListener("mousemove", (e) => {
  if (!cursor) return;
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});
document.querySelectorAll("a, button").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    cursor.style.width = "36px";
    cursor.style.height = "36px";
  });
  el.addEventListener("mouseleave", () => {
    cursor.style.width = "10px";
    cursor.style.height = "10px";
  });
});
