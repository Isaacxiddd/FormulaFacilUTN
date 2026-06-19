let initGuard = false;

export function openGaussJordan() {
    const gjView = document.getElementById('gaussJordanView');
    const mainView = document.getElementById('mainAppView');
    if (!gjView || !mainView) return;

    mainView.style.display = 'none';
    gjView.style.display = 'block';

    if (!initGuard) {
        import('../modules/gauss-jordan/view.js').then(({ initGaussJordan }) => {
            initGaussJordan('gaussJordanView');
        });
        initGuard = true;
    }
}

export function closeGaussJordan() {
    const gjView = document.getElementById('gaussJordanView');
    const mainView = document.getElementById('mainAppView');
    if (!gjView || !mainView) return;

    gjView.style.display = 'none';
    mainView.style.display = 'block';
}
