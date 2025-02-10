"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";

export default function FaqMain() {
  const [expandedItems, setExpandedItems] = useState(["1"]);

  const handleAccordionChange = (newExpandedItems) => {
    setExpandedItems(newExpandedItems);
  };

  // Define FAQ data
  const faqData = [
    {
      category: "Dental Care",
      questions: [
        {
          id: "1",
          question: "What type of toothbrush and toothpaste should I use?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?",
        },
        {
          id: "2",
          question: "Do I really need to floss?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?",
        },
        {
          id: "3",
          question: "What are early signs of dental trouble?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?",
        },
        {
          id: "4",
          question: "Why do I need dental test?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?",
        },
        {
          id: "5",
          question: "How do fillings work?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?",
        },
      ],
    },
    {
      category: "Cardiology",
      questions: [
        {
          id: "6",
          question: "What is Cardiologist?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident porro laboriosam magni labore quaerat, aspernatur iusto error ducimus adipisci, et corporis recusandae illum tenetur hic? Earum excepturi porro fuga ipsum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sint natus ipsa accusantium saepe dolorem a mollitia tempora consequatur totam modi pariatur nulla, aspernatur dolore consequuntur temporibus unde minima repellendus laboriosam.",
        },
        {
          id: "7",
          question: "What is a Cardiothoracic surgeon?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident porro laboriosam magni labore quaerat, aspernatur iusto error ducimus adipisci, et corporis recusandae illum tenetur hic? Earum excepturi porro fuga ipsum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sint natus ipsa accusantium saepe dolorem a mollitia tempora consequatur totam modi pariatur nulla, aspernatur dolore consequuntur temporibus unde minima repellendus laboriosam.",
        },
        {
          id: "8",
          question: "How does a stress test work?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident porro laboriosam magni labore quaerat, aspernatur iusto error ducimus adipisci, et corporis recusandae illum tenetur hic? Earum excepturi porro fuga ipsum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sint natus ipsa accusantium saepe dolorem a mollitia tempora consequatur totam modi pariatur nulla, aspernatur dolore consequuntur temporibus unde minima repellendus laboriosam.",
        },
        {
          id: "9",
          question: "Are cardiopulmonary problems hereditary?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident porro laboriosam magni labore quaerat, aspernatur iusto error ducimus adipisci, et corporis recusandae illum tenetur hic? Earum excepturi porro fuga ipsum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sint natus ipsa accusantium saepe dolorem a mollitia tempora consequatur totam modi pariatur nulla, aspernatur dolore consequuntur temporibus unde minima repellendus laboriosam.",
        },
        {
          id: "10",
          question: "Do cardiac tests hurt?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident porro laboriosam magni labore quaerat, aspernatur iusto error ducimus adipisci, et corporis recusandae illum tenetur hic? Earum excepturi porro fuga ipsum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sint natus ipsa accusantium saepe dolorem a mollitia tempora consequatur totam modi pariatur nulla, aspernatur dolore consequuntur temporibus unde minima repellendus laboriosam.",
        },
      ],
    },
    {
      category: "Diagnosis",
      questions: [
        {
          id: "11",
          question: "What do we know about diagnostic error?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?3",
        },
        {
          id: "12",
          question: "How often does it happen?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?3",
        },
        {
          id: "13",
          question: "What is the cause of diagnostic error?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?3",
        },
        {
          id: "14",
          question: "What are the obstacles to accurate diagnosis?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?3",
        },
        {
          id: "15",
          question: "When is a formal diagnosis necessary?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis modi ullam amet debitis libero veritatis enim repellat optio natus eum delectus deserunt, odit expedita eos molestiae ipsa totam quidem? Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel, quos mollitia voluptatum aliquam repellendus similique iure fuga aspernatur amet odit! At vitae dicta excepturi quasi? Veritatis, pariatur excepturi! Illum, ut?3",
        },
      ],
    },
  ];

  return (
    <>
      <section className="faq-area section">
        <div className="container">
          {faqData.map((category) => (
            <div className="row faq-wrap" key={category.category}>
              <div className="col-lg-12">
                <div className="faq-head">
                  <h2>{category.category}</h2>
                </div>
                <div className="faq-item">
                  <Accordion
                    className="panel-group"
                    preExpanded={expandedItems}
                    onChange={handleAccordionChange}
                  >
                    {category.questions.map((question) => (
                      <AccordionItem
                        className="panel panel-default"
                        key={question.id}
                        uuid={question.id}
                      >
                        <AccordionItemHeading>
                          <AccordionItemButton>
                            {question.question}
                          </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                          <p>{question.answer}</p>
                        </AccordionItemPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
