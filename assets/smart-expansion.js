(() => {
  const directory = document.querySelector('.sx-directory');
  if (directory) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && directory.open) {
        directory.open = false;
        directory.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => {
      if (!directory.contains(event.target)) directory.open = false;
    });
  }
  const filters = [...document.querySelectorAll('[data-scene-filter]')];
  const cards = [...document.querySelectorAll('[data-scene-category]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.sceneFilter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = selected !== 'all' && card.dataset.sceneCategory !== selected;
      if (!card.hidden) count++;
    });
    document.querySelector('.sx-filter-status').textContent = `Показано ${count} ${count === 12 ? 'сценариев' : 'сценария'}`;
  }));
  const select = document.querySelector('#sx-appliance-type');
  const outcomes = {
    resumes: ['Возможный кандидат.', 'Можно рассмотреть управление питанием после проверки допустимой нагрузки, пусковых особенностей и инструкции прибора. Сначала испытываем его реальное поведение.'],
    standby: ['Питание — ещё не запуск.', 'Розетка сможет подать или отключить питание, но не нажмёт кнопку прибора. Для запуска рассматриваем штатную интеграцию или другой поддерживаемый производителем способ.'],
    critical: ['Отдельная инженерная задача.', 'Постоянные системы не включаем в обычный бытовой сценарий розеток. Требования к непрерывной работе, управлению и резервированию определяем отдельно.']
  };
  select?.addEventListener('change', () => {
    const [title, copy] = outcomes[select.value];
    document.querySelector('[data-fit-title]').textContent = title;
    document.querySelector('[data-fit-copy]').textContent = copy;
  });
  const toggle = document.querySelector('[data-network-toggle]');
  toggle?.addEventListener('click', () => {
    const online = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(online));
    document.querySelector('[data-network-label]').textContent = online ? 'Подключён' : 'Отключён';
    document.querySelector('.sx-network-lab').classList.toggle('is-offline', !online);
    document.querySelector('[data-cloud-state]').textContent = online ? 'Доступен при связи' : 'Цепочка прервана';
    document.querySelector('[data-cloud-copy]').textContent = online
      ? 'Для маршрута через облачный сервис нужны интернет и доступность сервиса. Это отдельная зависимость, даже если устройство стоит рядом.'
      : 'Внешний сервис недоступен из дома. Команда по этому облачному маршруту не доходит; ручное или отдельно настроенное локальное управление проверяется независимо.';
    document.querySelector('.sx-network-status').textContent = online
      ? 'Интернет подключён. Доступность обеих цепочек зависит также от питания, связи и настройки.'
      : 'Интернет отключён в этой схеме. Подходящее локальное правило может продолжить работу; облачный маршрут прерван. Питание и домашняя сеть сохранены.';
  });
})();
