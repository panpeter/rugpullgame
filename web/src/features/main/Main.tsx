import React from 'react';
import styles from "./Main.module.css"
import {NavLink} from "react-router-dom";
import {contracts} from "../../app/web3";

export function Main() {
    const contract = contracts.keys().next().value

    return (
        <React.Fragment>
            <h1 className={styles.title}>RUG PULL</h1>

            <div className={`panel ${styles.rules}`}>
                Game on Polygon with 3 simple rules:
                <ol>
                    <li>Pump the reward pool with 1 MATIC.</li>
                    <li>Wait 30 blocks.</li>
                    <li>If nobody else pumps, you can do a rug pull and grab the reward pool 💰</li>
                </ol>
            </div>

            <div className={styles.button_container}>
                <NavLink to={contract}>
                    <button>Play</button>
                </NavLink>
            </div>
        </React.Fragment>
    );
}
