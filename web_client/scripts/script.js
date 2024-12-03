// 获取幻灯片和名称元素
const slides = document.querySelectorAll('.slider .slide'); // 每个幻灯片是 <a> 标签
const slideNames = document.querySelectorAll('.slide-names li'); // 按钮

let currentIndex = 0; // 当前显示的幻灯片索引
let interval; // 自动切换的计时器

// 初始化幻灯片状态
function initSlides() {
    slides.forEach((slide, index) => {
        if (index === 0) {
            slide.classList.add('active'); // 默认第一张为活动状态
            slide.style.top = '0'; // 第一张显示在视口
        } else {
            slide.style.top = '100%'; // 其他幻灯片初始化到视口下方
        }
    });
    // 初始化右侧按钮状态
    slideNames[currentIndex].classList.add('active'); // 让第一个按钮处于激活状态

}

// 切换到指定幻灯片
function showSlide(index) {
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[index];

    // 动态计算切换方向
    if (index > currentIndex) {
        currentSlide.style.top = '-100%'; // 当前幻灯片滑出视口上方
        nextSlide.style.top = '0'; // 下一张幻灯片进入视口
    } 
    else if (index < currentIndex) {
        currentSlide.style.top = '100%'; // 当前幻灯片滑出视口下方
        nextSlide.style.top = '0'; // 下一张幻灯片进入视口
    }

    currentSlide.classList.remove('active');
    nextSlide.classList.add('active');

    // 更新索引
    currentIndex = index;

    // 更新名称的激活状态
    slideNames.forEach(name => name.classList.remove('active'));
    slideNames[currentIndex].classList.add('active');
}

// 自动切换到下一张幻灯片
function nextSlide() {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
}

// 开始自动播放
function startAutoPlay() {
    interval = setInterval(nextSlide, 3000); // 每 3 秒切换一次
}

// 鼠标悬停时切换幻灯片
slideNames.forEach((name, index) => {
    name.addEventListener('mouseover', () => {
        clearInterval(interval); // 停止自动播放
        showSlide(index); // 切换到对应的幻灯片
    });

    name.addEventListener('mouseout', () => {
        startAutoPlay(); // 鼠标离开后恢复自动播放
    });
});

// 初始化
initSlides();
startAutoPlay();
