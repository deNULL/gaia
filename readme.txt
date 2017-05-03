Gaia - движок для процедурной генерации планет.

В папке js-playground находится прототип на JavaScript, в папке rust -
код движка на Rust.

js-playground/voronoi.html
Демо алгоритма построения диаграммы Вороного на сфере.
Основан на работах
- A Plane Sweep Algorithm for the Voronoi Tessellation of the Sphere
Xiaoyu Zheng, Roland Ennis, Gregory P. Richards, and Peter Palffy-Muhoray

- Sweeping the Sphere
Joao Dinis, Margarida Mamede

Построение работает за O(n log n). Использованы следующие структуры данных
js-playground/src/apq.js - адаптивная очередь с приоритетами
js-playground/src/rbtree.js - красно-черное дерево
js-playground/src/skiplist.js - список с пропусками (сейчас не используется)

Алгоритм находится в
js-playground/src/voronoi.js

Работает аналогично алгоритму Форчуна для плоскости.

js-playground/relaxation.html
Демо диаграммы Вороного + релаксации Ллойда на сфере.

js-playground/subdivide.html
Демо авторского алгоритма разбиения графа и разбиения ландшафта на сушу и воду.

Код алгоритма в
js-playground/src/subdivide.js

Позволяет увеличивать число вершин и ребер графа в произвольных частях графах,
одновременно применяя дисплейсмент (фрактальный шум). Может использоваться
для построения ландшафта с нуля, для улучшения результатов других
алгоритмов, для формирования береговых линий, рек, дорог.

Для генерации случайного шума использована реализация вихря Мерсенна:
js-playground/src/mt-prng.js

Аналогично, в папке rust реализованы соответствующие части кода:
rust/src/apqueue.rs - адаптивная очередь с приоритетами
rust/src/rbtree.rs - красно-черное дерево
rust/src/voronoi.rs - построение диаграммы Вороного (не завершен)

TODO:
- проверить создание событий Roll event (сейчас их избыточно много)
- закончить диаграмму Вороного на Rust
- перенести алгоритм subdivide на Rust
- добавить алгоритм расширения ребер в графе (для рек/дорог)
- материки, водоразделы, высота/температура/влажность, эрозия, биомы
- пещеры
- прокладывание карты дорог, поиск кратчайших маршрутов
- визуализатор на OpenGL

На данный момент разработка приостановлена.

Идеи процедурной генерации ландшафта основаны на статьях
Polygonal Map Generation for Games
http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/

Procedural Planet Generation
http://experilous.com/1/blog/post/procedural-planet-generation

Денис Ольшин, 2017
