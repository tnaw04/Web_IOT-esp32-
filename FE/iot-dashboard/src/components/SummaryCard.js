
import './SummaryCard.css';



const SummaryCard = ({ title, value, icon, isAlerting }) => {
  
  
  const cardClassName = `summary-card ${isAlerting ? 'alert' : ''}`;

  return (
    <div className={cardClassName}> 
      <div className="card-icon">{icon}</div>
      <div className="card-info">
        <p className="card-title">{title}</p>
        <p className="card-value">{value}</p>
      </div>
    </div>
  );
};

export default SummaryCard;