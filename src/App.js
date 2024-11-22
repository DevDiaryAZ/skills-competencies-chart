import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { DATA } from './data/data.js';

export const App = () => {
  return (
    <>
      <main>
        <div className="wrapper">
          <h2>Круговая диаграмма связей</h2>
          <CircularGraph />
        </div>
      </main>
    </>
  );
};

const CircularGraph = () => {
  const chartRef = useRef(null);
  const [activeNode, setActiveNode] = useState(null);
  const [currentVisibleLinks, setCurrentVisibleLinks] = useState([]);

  const calculateSimilarity = (skillsA, skillsB) => {
    const commonSkills = skillsA.filter((skill) => skillsB.includes(skill));
    return commonSkills.length;
  };

  const sortBySimilarSkills = (data) => {
    const sortedData = [...data];

    const similarityScores = sortedData.map((item, index) => {
      let totalSimilarity = 0;

      sortedData.forEach((otherItem, otherIndex) => {
        if (index !== otherIndex) {
          const similarity = calculateSimilarity(item.mainSkills, otherItem.mainSkills);
          totalSimilarity += similarity;
        }
      });

      return { ...item, score: totalSimilarity };
    });

    return similarityScores
      .sort((a, b) => b.score - a.score)
      .map((item) => {
        const { score, ...rest } = item;
        return rest;
      });
  };

  let sortedData = sortBySimilarSkills(DATA);

  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom);

    const nodesLarge = sortedData.flatMap((person) => {
      const personSkills = [
        { name: person.name, category: 'person' }, // Узел для профессии
        ...person.mainSkills.map((skill) => ({ name: skill, category: 'skill' })), // Узлы для основных навыков
        ...person.otherSkills.map((skill) => ({ name: skill, category: 'skill' })), // Узлы для других навыков
      ];

      return personSkills.filter(
        (node, index, self) => index === self.findIndex((n) => n.name === node.name),
      );
    });

    const data = {
      nodes: [],
      links: [],
      persistentLinks: [],
    };

    // Группируем узлы по категориям
    const persons = nodesLarge.filter((node) => node.category === 'person');
    const skills = nodesLarge
      .filter((node) => node.category === 'skill')
      .reduce((unique, current) => {
        if (!unique.some((skill) => skill.name === current.name)) {
          unique.push(current);
        }
        return unique;
      }, []);

    const totalPersons = persons.length;
    const totalSkills = skills.length;

    const radiusPerson = 100; // Радиус для круга с профессиями
    const radiusSkill = 300; // Радиус для круга с навыками

    const personsLabelRadius = radiusSkill + 65;
    // Размещаем узлы профессий
    persons.forEach((node, index) => {
      const angle = (index * Math.PI * 2) / totalPersons; // Угол для распределения по кругу

      // Угол в градусах
      const deg = angle * (180 / Math.PI);
      data.nodes.push({
        id: `${index}`,
        name: node.name,
        category: 'person',
        x: radiusPerson * Math.cos(angle) + 300,
        y: radiusPerson * Math.sin(angle) + 300,
        itemStyle: {
          color: activeNode === node.name ? '#00A372' : '#ADADAD',
          borderColor: activeNode === node.name ? '#00A372' : 'transparent',
          borderWidth: activeNode === node.name ? 3 : 0,
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function (params) {
            return `${params.name.replace(/ /g, '\n')}`;
          },
          offset: [
            personsLabelRadius * Math.cos(angle) - radiusSkill * Math.cos(angle),
            personsLabelRadius * Math.sin(angle) - radiusSkill * Math.sin(angle),
          ],
        },
        emphasis: {
          itemStyle: {
            color: '#00A372',
          },
        },
        deg: deg,
      });
    });

    const skillsLabelRadius = radiusSkill + 50;
    // Размещаем узлы навыков
    skills.forEach((node, index) => {
      const angle = (index * Math.PI * 2) / totalSkills;
      const skillIndex = index + totalPersons;

      // Угол в градусах
      const deg = angle * (180 / Math.PI);
      data.nodes.push({
        id: `${skillIndex}`,
        name: node.name,
        category: 'skill',
        x: radiusSkill * Math.cos(angle) + 300, // Положение по оси X
        y: radiusSkill * Math.sin(angle) + 300, // Положение по оси Y
        itemStyle: {
          color: '#FFD4AD',
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}',
          offset: [
            skillsLabelRadius * Math.cos(angle) - radiusSkill * Math.cos(angle),
            skillsLabelRadius * Math.sin(angle) - radiusSkill * Math.sin(angle),
          ],
        },
        emphasis: {
          itemStyle: {
            color: '#FF7A00',
          },
        },
        deg: deg,
      });
    });

    // Формирование массива связей
    sortedData.forEach((person, index) => {
      const sourceId = index.toString();

      person.mainSkills.forEach((skill) => {
        let targetId;
        data.nodes.filter((el) => (el.name === skill ? (targetId = el.id) : null));
        data.links.push({
          source: sourceId,
          target: targetId,
          lineStyle: { color: '#8F59B9' },
          persistent: false,
        });
      });
      person.otherSkills.forEach((skill) => {
        let targetId;
        data.nodes.filter((el) => (el.name === skill ? (targetId = el.id) : null));
        data.links.push({
          source: sourceId,
          target: targetId,
          lineStyle: { color: '#FF7A00' },
          persistent: false,
        });
      });
    });

    // Добавление связей между узлами person для формирования окружности
    sortedData.forEach((person, index) => {
      const sourceId = index.toString();
      const nextIndex = (index + 1) % totalPersons;
      data.persistentLinks.push({
        source: sourceId,
        target: nextIndex.toString(),
        lineStyle: { color: '#ADADAD', curveness: 0.2 },
        persistent: true,
      });
    });

    // Добавление связей между узлами skills для формирования окружности
    skills.forEach((skill, index) => {
      const skillIndex = index + totalPersons;
      const nextSkillIndex = ((index + 1) % totalSkills) + totalPersons;
      data.persistentLinks.push({
        source: skillIndex.toString(),
        target: nextSkillIndex.toString(),
        lineStyle: { color: '#ADADAD', curveness: 0.1 },
        persistent: true,
      });
    });

    const updateChart = () => {
      const option = {
        layout: 'none',
        series: [
          {
            type: 'graph',
            layout: 'none',
            data: data.nodes.map((node) => {
              const isActive = activeNode === node.name;
              if (activeNode) {
                let activeNodeId;
                data.nodes.filter((el) => (el.name === activeNode ? (activeNodeId = el.id) : null));
                const isLinked = data.links.some(
                  (link) =>
                    (link.source === node.id && link.target === activeNodeId) ||
                    (link.target === node.id && link.source === activeNodeId),
                );
                const isConnectedToActiveNode = currentVisibleLinks.some(
                  (link) => link.source === node.id || link.target === node.id,
                );
                const isPersonCategory = node.category === 'person';

                return {
                  ...node,
                  label: {
                    ...node.label,
                    opacity: isPersonCategory ? 1 : isConnectedToActiveNode ? 1 : 0.3,
                  },
                  itemStyle: {
                    color: isLinked ? '#FF7A00' : node.itemStyle.color,
                    borderWidth: isActive ? 4 : 0,
                  },
                };
              }
              return node;
            }),
            links: [
              ...data.persistentLinks,
              ...data.links.filter((link) =>
                currentVisibleLinks.some(
                  (l) => l.source === link.source && l.target === link.target,
                ),
              ),
            ],
            symbolSize: 28,
            height: '530px',
            label: {
              show: true,
              color: '#3A3A3A',
              fontSize: 10,
              fontFamily: 'ALS Hauss',
              lineHeight: 12,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderColor: '#F4F4F4',
              borderWidth: 1,
              borderRadius: 6,
              padding: [3, 8],
            },
            emphasis: {
              itemStyle: {
                blur: true,
              },
            },
            itemStyle: {
              color: '#ffcc00',
            },

            lineStyle: {
              // color: '#FF7A00',
              curveness: 0.3,
              width: 2,
              smooth: true,
            },
          },
        ],
      };

      myChart.setOption(option);
    };

    // Обработчик на элементе графа
    myChart.on('click', (params) => {
      if (params.data && params.data.category === 'person') {
        const personName = params.data.name;

        setActiveNode(personName); // Устанавливаем активный узел
        const linksForPerson = data.links.filter((link) => {
          const personId = data.nodes.findIndex(
            (node) => node.name === personName && node.category === 'person',
          );
          return link.source === personId.toString();
        });
        setCurrentVisibleLinks(linksForPerson);

        updateChart();
      } else {
        setActiveNode(null); // Сбрасываем активный узел
        setCurrentVisibleLinks([]); // Сбрасываем видимые связи
        updateChart();
      }
    });

    updateChart();
    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.off('click');
    };
  }, [activeNode, currentVisibleLinks, sortedData]);

  return <div ref={chartRef} style={{ width: '1000px', height: '800px' }} />;
};

export default CircularGraph;
