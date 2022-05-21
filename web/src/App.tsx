import React from 'react';
import {BrowserRouter as Router, Route, Routes,} from 'react-router-dom';
import {Main} from "./features/main/Main";
import {Game} from "./features/game/Game";
import {Footer} from "./features/main/Footer";

function App() {
    return (
        <Router>
            <main>
                <Routes>
                    <Route
                        path="/0x5FbDB2315678afecb367f032d93F642f64180aa3"
                        element={<Game contractAddress={"0x5FbDB2315678afecb367f032d93F642f64180aa3"}/>}
                    />
                    <Route index element={<Main/>}/>
                </Routes>
            </main>
            <Footer/>
        </Router>
    );
}

export default App;
