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
                        path="/0x3bc9Fa2CbA7090aa3Eb7F8d24C66098B5E429312"
                        element={<Game contractAddress={"0x3bc9Fa2CbA7090aa3Eb7F8d24C66098B5E429312"}/>}
                    />
                    <Route index element={<Main/>}/>
                </Routes>
            </main>
            <Footer/>
        </Router>
    );
}

export default App;
