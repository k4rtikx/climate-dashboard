import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

actor {
  // Types
  type ClimateData = {
    timestamp : Time.Time;
    co2 : Nat;
    temperature : Float;
    airQualityIndex : Nat;
    renewableEnergyUsage : Float;
  };

  type UserQuery = {
    user : Principal;
    userQueryText : Text;
    response : Text;
    timestamp : Time.Time;
  };

  // Persistent Data Storage
  let historicalData = Map.empty<Time.Time, ClimateData>();
  let userQueries = Map.empty<Principal, [UserQuery]>();
  let dashboardPrefs = Map.empty<Principal, Text>();

  module ClimateData {
    public func compareByCO2(data1 : ClimateData, data2 : ClimateData) : Order.Order {
      Nat.compare(data1.co2, data2.co2);
    };
  };

  // Add climate data entry
  public shared ({ caller }) func addClimateData(timestamp : Time.Time, co2 : Nat, temp : Float, aqi : Nat, renewable : Float) : async () {
    let data : ClimateData = {
      timestamp;
      co2;
      temperature = temp;
      airQualityIndex = aqi;
      renewableEnergyUsage = renewable;
    };
    historicalData.add(timestamp, data);
  };

  // Get sorted climate data
  public query ({ caller }) func getSortedClimateData() : async [ClimateData] {
    let dataArray = historicalData.values().toArray();
    dataArray.sort(ClimateData.compareByCO2);
  };

  // Save user query
  public shared ({ caller }) func saveUserQuery(userQueryText : Text, response : Text) : async () {
    let timestamp = Time.now();
    let userQuery : UserQuery = {
      user = caller;
      userQueryText;
      response;
      timestamp;
    };

    let existingQueries = switch (userQueries.get(caller)) {
      case (null) { [] };
      case (?queries) { queries };
    };

    userQueries.add(caller, existingQueries.concat([userQuery]));
  };

  // Get user queries
  public query ({ caller }) func getUserQueries(user : Principal) : async [UserQuery] {
    switch (userQueries.get(user)) {
      case (null) { [] };
      case (?queries) { queries };
    };
  };

  // Save dashboard preferences
  public shared ({ caller }) func saveDashboardPrefs(prefs : Text) : async () {
    dashboardPrefs.add(caller, prefs);
  };

  // Get dashboard preferences
  public query ({ caller }) func getDashboardPrefs(user : Principal) : async Text {
    switch (dashboardPrefs.get(user)) {
      case (null) { Runtime.trap("No preferences set") };
      case (?prefs) { prefs };
    };
  };

  // Helper function to transform API response
  public query ({ caller }) func transformResponse(response : Text) : async Text {
    response;
  };
};
