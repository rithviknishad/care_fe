import React, { useEffect, useRef } from "react";
import Breadcrumbs from "./Breadcrumbs";
import PageHeadTitle from "./PageHeadTitle";
import clsx from "clsx";
import { goBack } from "../../Utils/utils";

interface PageTitleProps {
  title: string;
  hideBack?: boolean;
  backUrl?: string;
  backButtonCB?: () => number | void;
  className?: string;
  componentRight?: React.ReactNode;
  justifyContents?:
    | "justify-center"
    | "justify-start"
    | "justify-end"
    | "justify-between";
  breadcrumbs?: boolean;
  crumbsReplacements?: {
    [key: string]: { name?: string; uri?: string; style?: string };
  };
  focusOnLoad?: boolean;
}

export default function PageTitle(props: PageTitleProps) {
  const {
    title,
    hideBack,
    backUrl,
    backButtonCB,
    className = "",
    componentRight = <></>,
    breadcrumbs = true,
    crumbsReplacements = {},
    justifyContents = "justify-start",
    focusOnLoad = false,
  } = props;

  const divRef = useRef<any>();

  useEffect(() => {
    if (divRef.current && focusOnLoad) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [divRef, focusOnLoad]);

  const onBackButtonClick = () =>
    goBack((backButtonCB && backButtonCB()) || backUrl);

  return (
    <div ref={divRef} className={`my-10 ${className}`}>
      <PageHeadTitle title={title} />
      <div
        className={clsx({
          "flex items-center": true,
          [justifyContents]: true,
        })}
      >
        <div className="flex items-center">
          {!hideBack && (
            <button onClick={onBackButtonClick}>
              <i className="fa-solid fa-chevron-left rounded-md text-xs p-2 hover:bg-gray-200 mr-1">
                {" "}
              </i>
            </button>
          )}
          <h2 className="font-medium text-black text-lg leading-tight ml-0">
            {title}
          </h2>
        </div>
        {componentRight}
      </div>
      <div className={hideBack ? "my-2" : "ml-8 my-2"}>
        {breadcrumbs && <Breadcrumbs replacements={crumbsReplacements} />}
      </div>
    </div>
  );
}
