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
                        path="/0xB55DD5b91Ef815cEc527e054B67f4D298111aD9F"
                        element={<Game contractAddress={"0xB55DD5b91Ef815cEc527e054B67f4D298111aD9F"}/>}
                    />
                    <Route index element={<Main/>}/>
                </Routes>
            </main>
            <Footer/>
        </Router>
    );
}

export default App;
