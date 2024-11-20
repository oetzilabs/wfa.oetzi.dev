import { A } from "@solidjs/router";
import { For } from "solid-js";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function TestimonialSection() {
  const testimonials = [
    {
      remark: "not a real testimonial",
      quote:
        "Workflow Automation saved me hours of manual documentation work every month. So much more time for my actual work!",
      author: "Anonymous",
    },
    {
      remark: "not a real testimonial",
      quote: "Why didnt I hear about this before? It's the best!",
      author: "Anonymous",
    },
    {
      remark: "not a real testimonial",
      quote:
        "Workflow Automation is the best tool for my business. It has helped me streamline my operations and improve my productivity.",
      author: "Anonymous",
    },
    {
      remark: "not a real testimonial",
      quote: "Workflow Automation took me a couple minutes to set up, but now I can focus on my core business.",
      author: "Anonymous",
    },
  ];

  return (
    <div class="py-20 bg-black dark:bg-white">
      <div class="w-full gap-20 container mx-auto flex flex-col">
        <div class="flex flex-col gap-6 w-full">
          <Badge class="w-max text-white dark:text-black" variant="outline">
            Testimonials
          </Badge>
          <h3 class="text-5xl font-bold text-white dark:text-black">We have worked with wonderful people</h3>
        </div>
        <div class="flex flex-col gap-0 border border-neutral-800 dark:border-neutral-300 rounded-xl overflow-clip">
          <For each={testimonials}>
            {(testimonial) => (
              <blockquote class="flex flex-col items-start gap-2 mt-0 p-6 border-b border-neutral-800 dark:border-neutral-300">
                <span class="text-white dark:text-black italic">{testimonial.remark}</span>
                <span class="text-white dark:text-black">“{testimonial.quote}”</span>
                <div class="grow" />
                <span class="block font-medium text-muted-foreground">– {testimonial.author}</span>
              </blockquote>
            )}
          </For>
          <blockquote class="flex flex-col items-start gap-2 mt-0 p-6 last:border-b-0 border-b border-neutral-800 dark:border-neutral-300 dark:bg-neutral-100 bg-neutral-950">
            <span class="text-white dark:text-black font-bold">
              Wish to have your testimonial featured on our website?
            </span>
            <div class="grow" />
            <Button as={A} href="/contact" class="w-max">
              Contact Us!
            </Button>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default TestimonialSection;
