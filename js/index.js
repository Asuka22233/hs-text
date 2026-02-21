import { map } from "./map.js";
import { pathPointIcon } from "./icon.js";
import { pathPoints } from "./pathPoints.js";
import { searchRedSitesNow } from "./redSites.js"; // 引入红色景点搜索功能

// 创建全局markers对象用于存储所有标记
window.markersMap = {};

// 根据坐标打开弹窗的函数
window.openPopupByCoords = function (lat, lng) {
  const key = `${lat},${lng}`;
  if (window.markersMap[key]) {
    window.markersMap[key].openPopup();
  }
};

function setMapHeight() {
  let map = document.getElementById("map");
  map.style.height = window.innerHeight + "px";
}

setMapHeight();

window.addEventListener("resize", setMapHeight);
window.addEventListener("orientationchange", setMapHeight);

map.setView([INITIAL_LAT, INITIAL_LNG], DEFAULT_ZOOM);

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// 根据设备类型决定是否显示经纬度
document.getElementById("coordinate-display").style.display = isMobile()
  ? "none"
  : "block";

// pathPoints 现在存储的是 WGS-84 坐标，直接使用
const displayPoints = pathPoints;

displayPoints.forEach(function (point) {
  let marker = L.marker([point.lat, point.lng], { icon: pathPointIcon }).addTo(
    map,
  );
  let popupContent = `
            <b>${point.title}</b><br>
            <img src="${point.image}" alt="${point.title}" style="width:100%;" onerror="this.onerror=null;this.src='img/mark1.png';"><br>
            <p class=\"site-intro\">${point.content || "这是" + point.title}</p><br>
        `;
  marker
    .bindPopup(popupContent, {
      maxWidth: Math.min(300, window.innerWidth - 100),
      maxHeight: window.innerHeight - 200,
      autoPanPadding: [50, 100],
    })
    .openPopup()
    .closePopup();
  marker.on("click", function () {
    map.setView([point.lat, point.lng], map.getZoom(), {
      animate: true,
      duration: 0.5,
    });

    marker.openPopup();
  });

  // 存储marker到全局对象
  const key = `${point.lat},${point.lng}`;
  window.markersMap[key] = marker;
});

map.setView([INITIAL_LAT, INITIAL_LNG], 5);
let nav = document.querySelector("#location-nav");

let province = [];
for (let i = 0; i < displayPoints.length; i++) {
  if (!province.includes(displayPoints[i].location)) {
    province.push(displayPoints[i].location);
  }
}
province.sort((a, b) => a.localeCompare(b));

updateSidebar(displayPoints.filter((point) => point.location === province[0]));
console.log(province);
nav.innerHTML = province
  .map(
    (p) => `
    <option value="${p}">${p}</option>
`,
  )
  .join("");

nav.onchange = function () {
  updateSidebar(displayPoints.filter((point) => point.location === this.value));
};

function updateSidebar(points) {
  let sidebarList = document.getElementById("sidebar-list");
  sidebarList.innerHTML = points
    .map(
      (point) => `
        <li data-lat="${point.lat}" data-lng="${point.lng}">
            ${point.title}
        </li>
    `,
    )
    .join("");

  sidebarList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", function () {
      let lat = parseFloat(this.getAttribute("data-lat"));
      let lng = parseFloat(this.getAttribute("data-lng"));
      map.closePopup();
      map.setView([lat, lng], DEFAULT_ZOOM);
      // 打开该景点的详情弹窗
      openPopupByCoords(lat, lng);
    });
  });
}

document
  .getElementById("sidebar-toggle")
  .addEventListener("click", function () {
    let sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
  });

const redSitesRefresh = document.getElementById("red-sites-refresh");
if (redSitesRefresh) {
  redSitesRefresh.addEventListener("click", () => {
    searchRedSitesNow();
  });
}

// ============ 轮播图功能 ============
class Carousel {
  constructor() {
    this.currentIndex = 0;
    this.carouselData = [];
    this.toggleBtn = document.getElementById("carousel-toggle");
    this.content = document.getElementById("carousel-content");
    this.track = document.getElementById("carousel-track");
    this.dotsContainer = document.getElementById("carousel-dots");
    this.prevBtn = document.getElementById("carousel-prev");
    this.nextBtn = document.getElementById("carousel-next");
    this.autoPlayTimer = null;
    this.compactTimer = null;

    this.initEventListeners();
    this.initCarousel();
  }

  initEventListeners() {
    // 展开/收起按钮
    this.toggleBtn.addEventListener("click", () => {
      this.clearCompactTimer();
      this.toggleBtn.classList.remove("compact");
      this.toggleContent();
    });

    // 按钮hover时清除计时器
    this.toggleBtn.addEventListener("mouseenter", () => {
      this.clearCompactTimer();
      this.toggleBtn.classList.remove("compact");
      // 恢复文字
      if (this.content.style.display === "none") {
        this.toggleBtn.textContent = "▼展示图片";
      }
    });

    // 按钮离开时重新启动计时器
    this.toggleBtn.addEventListener("mouseleave", () => {
      if (this.content.style.display === "none") {
        this.startCompactTimer();
      }
    });

    // 左右箭头按钮
    this.prevBtn.addEventListener("click", () => {
      this.previousSlide();
    });

    this.nextBtn.addEventListener("click", () => {
      this.nextSlide();
    });

    // 绑定标题点击事件（事件委托）
    this.bindTitleClickEvents();
  }

  toggleContent() {
    if (this.content.style.display === "none") {
      this.content.style.display = "block";
      this.toggleBtn.textContent = "▲收起图片";
      this.clearCompactTimer();
      this.toggleBtn.classList.remove("compact");
      this.startAutoPlay();
    } else {
      this.content.style.display = "none";
      this.toggleBtn.textContent = "▼展示图片";
      this.toggleBtn.classList.remove("compact");
      this.startCompactTimer();
      this.stopAutoPlay();
    }
  }

  startCompactTimer() {
    this.clearCompactTimer();
    this.compactTimer = setTimeout(() => {
      if (this.content.style.display === "none") {
        this.toggleBtn.classList.add("compact");
        this.toggleBtn.textContent = "▼";
      }
    }, 2000);
  }

  clearCompactTimer() {
    if (this.compactTimer) {
      clearTimeout(this.compactTimer);
      this.compactTimer = null;
    }
  }

  // 获取随机的4个景点
  getRandomPoints(num = 4) {
    if (pathPoints.length === 0) return [];

    const shuffled = [...pathPoints].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(num, pathPoints.length));
  }

  // 更新轮播图数据
  updateCarousel() {
    this.carouselData = this.getRandomPoints(4);
    this.currentIndex = 0;
    this.renderSlides();
    this.renderDots();
    this.showSlide(0);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // 渲染幻灯片
  renderSlides() {
    this.track.innerHTML = this.carouselData
      .map(
        (point, index) => `
            <div class="carousel-slide ${index === 0 ? "active" : ""}">
                <img src="${point.image}" alt="${point.title}" class="carousel-image" onerror="this.onerror=null;this.src='img/mark1.png';" />
                <div class="carousel-title" data-lat="${point.lat}" data-lng="${point.lng}">${point.title}</div>
            </div>
        `,
      )
      .join("");

    // 为所有标题添加鼠标事件
    this.addTitleHoverEvents();
  }

  // 添加标题的hover事件
  addTitleHoverEvents() {
    this.track.querySelectorAll(".carousel-title").forEach((title) => {
      title.addEventListener("mouseenter", () => {
        title.classList.add("hover");
      });
      title.addEventListener("mouseleave", () => {
        title.classList.remove("hover");
      });
    });
  }

  // 绑定标题点击事件（在track上使用事件委托）
  bindTitleClickEvents() {
    this.track.removeEventListener("click", this.handleTitleClick);
    this.handleTitleClick = (e) => {
      const title = e.target.closest(".carousel-title");
      if (title) {
        const lat = parseFloat(title.getAttribute("data-lat"));
        const lng = parseFloat(title.getAttribute("data-lng"));
        map.closePopup();
        map.setView([lat, lng], DEFAULT_ZOOM);
        // 打开该景点的详情弹窗
        openPopupByCoords(lat, lng);
      }
    };
    this.track.addEventListener("click", this.handleTitleClick);
  }

  // 渲染点指示器
  renderDots() {
    this.dotsContainer.innerHTML = this.carouselData
      .map(
        (_, index) => `
            <div class="carousel-dot ${index === 0 ? "active" : ""}" data-index="${index}"></div>
        `,
      )
      .join("");

    // 给每个点添加点击事件
    this.dotsContainer.querySelectorAll(".carousel-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = parseInt(dot.getAttribute("data-index"));
        this.goToSlide(index);
      });
    });
  }

  // 显示指定幻灯片
  showSlide(index) {
    if (this.carouselData.length === 0) return;

    const slides = this.track.querySelectorAll(".carousel-slide");
    slides.forEach((slide) => slide.classList.remove("active"));
    slides[index].classList.add("active");

    // 更新点指示器
    const dots = this.dotsContainer.querySelectorAll(".carousel-dot");
    dots.forEach((dot) => dot.classList.remove("active"));
    if (dots[index]) {
      dots[index].classList.add("active");
    }
  }

  // 跳转到指定幻灯片（用于点击点时调用）
  goToSlide(index) {
    this.currentIndex = index;
    this.showSlide(index);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // 上一个幻灯片
  previousSlide() {
    if (this.carouselData.length === 0) return;

    this.currentIndex =
      (this.currentIndex - 1 + this.carouselData.length) %
      this.carouselData.length;
    this.showSlide(this.currentIndex);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // 下一个幻灯片
  nextSlide() {
    if (this.carouselData.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.carouselData.length;
    this.showSlide(this.currentIndex);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // 启动自动轮播（3秒切换一次）
  startAutoPlay() {
    this.stopAutoPlay(); // 清除旧定时器
    this.autoPlayTimer = setInterval(() => {
      this.nextSlide();
    }, 3000);
  }

  // 停止自动轮播
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  // 初始化轮播图
  initCarousel() {
    // 检测是否为移动设备
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile && this.content.style.display !== "none") {
      // 手机端默认关闭轮播图
      this.content.style.display = "none";
      this.toggleBtn.textContent = "▼展示图片";
      this.toggleBtn.classList.remove("compact");
      this.startCompactTimer();
    }

    this.updateCarousel();
  }
}

// 创建全局轮播图实例
const carousel = new Carousel();
