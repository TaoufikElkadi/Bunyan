"use client";

import { useEffect } from "react";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "bunyan_tour_completed";

export function OnboardingTour() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timeout = setTimeout(async () => {
      const { driver } = await import("driver.js");

      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} van {{total}}",
        nextBtnText: "Volgende",
        prevBtnText: "Vorige",
        doneBtnText: "Aan de slag",
        popoverClass: "bunyan-tour",
        overlayColor: "rgba(38, 27, 7, 0.3)",
        stagePadding: 8,
        stageRadius: 12,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, "true");
        },
        steps: [
          {
            popover: {
              title: "Welkom bij Bunyan \u{1F44B}",
              description:
                "We laten u kort zien hoe het dashboard werkt. U kunt de rondleiding altijd overslaan.",
            },
          },
          {
            element: "[data-tour='sidebar-nav']",
            popover: {
              title: "Navigatie",
              description:
                "Hier vindt u alle pagina's: donaties, dragers, fondsen, campagnes en meer.",
            },
          },
          {
            element: "[data-tour='header-search']",
            popover: {
              title: "Zoeken",
              description:
                "Zoek snel naar donateurs, fondsen of campagnes. U kunt ook \u2318K gebruiken.",
            },
          },
          {
            element: "[data-tour='donation-link']",
            popover: {
              title: "Uw donatiepagina",
              description:
                "Deel deze link met uw gemeenschap om donaties te ontvangen.",
            },
          },
          {
            element: "[data-tour='sidebar-settings']",
            popover: {
              title: "Instellingen",
              description:
                "Configureer uw moskee, koppel Stripe en beheer uw team.",
            },
          },
        ],
      });

      driverObj.drive();
    }, 600);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <style>{`
      .bunyan-tour.driver-popover {
        background: #fffefb;
        border: 1px solid #e3dfd5;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(38, 27, 7, 0.12);
        padding: 24px;
        max-width: 340px;
      }

      .bunyan-tour .driver-popover-title {
        font-size: 17px;
        font-weight: 700;
        color: #261b07;
        letter-spacing: -0.3px;
      }

      .bunyan-tour .driver-popover-description {
        font-size: 13px;
        color: #8a8478;
        line-height: 1.6;
        margin-top: 6px;
      }

      .bunyan-tour .driver-popover-progress-text {
        font-size: 11px;
        color: #b5b0a5;
      }

      .bunyan-tour .driver-popover-navigation-btns {
        gap: 8px;
        margin-top: 16px;
      }

      .bunyan-tour .driver-popover-next-btn {
        background: #261b07;
        color: #fafaf8;
        border: none;
        border-radius: 10px;
        padding: 8px 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }

      .bunyan-tour .driver-popover-next-btn:hover {
        background: #3a2d17;
      }

      .bunyan-tour .driver-popover-prev-btn {
        background: transparent;
        color: #8a8478;
        border: 1px solid #e3dfd5;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bunyan-tour .driver-popover-prev-btn:hover {
        background: #f3f1ec;
        color: #261b07;
      }

      .bunyan-tour .driver-popover-close-btn {
        color: #b5b0a5;
        top: 16px;
        right: 16px;
      }

      .bunyan-tour .driver-popover-close-btn:hover {
        color: #261b07;
      }

      .bunyan-tour .driver-popover-arrow {
        border: 1px solid #e3dfd5;
      }

      .driver-overlay {
        background: rgba(38, 27, 7, 0.3) !important;
        backdrop-filter: blur(2px);
      }
    `}</style>
  );
}
