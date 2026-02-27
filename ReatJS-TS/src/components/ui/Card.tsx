import React from "react";
import "./Card.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
}) => {
  const classes = ["card", hover && "card-hover", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};

export default Card;
