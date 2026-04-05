"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "bunyan_tour_completed";
const MOBILE_BREAKPOINT = 768;

export function OnboardingTour() {
  const { setOpenMobile } = useSidebar();
  const setOpenMobileRef = useRef(setOpenMobile);
  setOpenMobileRef.current = setOpenMobile;

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

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
          if (isMobile()) setOpenMobileRef.current(false);
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
              onPopoverRender: () => {
                if (isMobile()) setOpenMobileRef.current(true);
              },
            },
          },
          {
            element: "[data-tour='header-search']",
            popover: {
              title: "Zoeken",
              description:
                "Zoek snel naar donateurs, fondsen of campagnes. U kunt ook \u2318K gebruiken.",
              onPopoverRender: () => {
                if (isMobile()) setOpenMobileRef.current(false);
              },
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
              onPopoverRender: () => {
                if (isMobile()) setOpenMobileRef.current(true);
              },
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

      @media (max-width: 374px) {
        .bunyan-tour.driver-popover {
          max-width: calc(100vw - 2rem);
          padding: 16px;
        }
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
        background: #C87D3A;
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 8px 20px;
        font-size: 13px;
        font-weight: 600;
        font-style: normal;
        letter-spacing: 0;
        cursor: pointer;
        transition: background 0.15s;
      }

      .bunyan-tour .driver-popover-next-btn:hover {
        background: #a8632a;
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
        background: rgba(38, 27, 7, 0.4) !important;
      }
    `}</style>
  );
}
